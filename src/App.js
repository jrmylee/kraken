import { Button, Menu, Dropdown } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import React from 'react';
import 'antd/dist/antd.css'; // or 'antd/dist/antd.less'
import 'microphone-stream';
import io from 'socket.io-client';

class App extends React.Component {
  
  constructor(props) {
    super(props);
    var socket = io("http://localhost:5000/test");
    this.state = {
      started : false,
      microphone : null,
      socket: socket,
      lenSamples : 0,
      localTempo: "none",
      globalTempo: "none",
      localVolume: "none"
    };
  }
  menu = (
    <Menu>
      <Menu.Item>
        <a target="_blank" rel="noopener noreferrer" href="http://www.alipay.com/">
          1 sec
        </a>
      </Menu.Item>
      <Menu.Item>
        <a target="_blank" rel="noopener noreferrer" href="http://www.taobao.com/">
          2 sec
        </a>
      </Menu.Item>
      <Menu.Item>
        <a target="_blank" rel="noopener noreferrer" href="http://www.tmall.com/">
          3 sec
        </a>
      </Menu.Item>
    </Menu>
  );
  enterLoading = () => {
    var ob = this;
    this.state.socket.connect();

    navigator.mediaDevices
      .getUserMedia({ audio: true }).then((stream) => {
        var audioContext = new (window.AudioContext || window.webkitAudioContext)();
        var source = audioContext.createMediaStreamSource(stream);
        var node = audioContext.createScriptProcessor(4096, 1, 1);
        console.log(audioContext.sampleRate);
        this.state.socket.emit('sample_rate', audioContext.sampleRate);
        node.onaudioprocess = (audioProcessingEvent) => {
            // The input buffer is the song we loaded earlier
          let inputBuffer = audioProcessingEvent.inputBuffer;
          var left = inputBuffer.getChannelData(0);
          this.state.socket.emit("message", left);
          this.setState({lenSamples : this.state.lenSamples + 1})
          if(this.state.lenSamples == 3) {
            this.setState({lenSamples : 0 });
            this.state.socket.emit('tempo', true);
          }
        }
        this.state.socket.on('output local tempo', ({tempo}) => {
          this.setState({
            localTempo : tempo
          })
        })
        this.state.socket.on('output global tempo', ({tempo}) => {
          this.setState({
            globalTempo : tempo
          })
        })
        // Connect the microphone to the script processor
        source.connect(node);
        node.connect(audioContext.destination);

        this.setState({
          source: source,
          node: node
        })
      });
  };
  stop = () => {
    if(this.state.source){
      this.state.socket.emit("tempo", false);
      console.log(this.state.signal);
      this.state.node.disconnect();
      this.state.source.disconnect();
      this.setState({
        source: null,
        node: null,
      });
    }
  };
  render() {
    return (
      <>
        <div className="main-container">
          <div className="info-container">
            <p>Current Tempo: {this.state.localTempo}</p>
            <p>Global Tempo: {this.state.globalTempo}</p>
            <p>Current Volume: {this.state.localVolume}</p>
          </div>
          <div className="center-console">
            <Button type="primary" onClick={() => this.enterLoading()}>
              Start
            </Button>
            <Button type="danger" onClick={() => this.stop()}>
              Stop
            </Button>
            <Dropdown overlay={this.menu}>
              <a className="ant-dropdown-link" onClick={e => e.preventDefault()}>
                Window Size <DownOutlined />
              </a>
            </Dropdown>
          </div>
        </div>
      </>
    );
  }
}

export default App;