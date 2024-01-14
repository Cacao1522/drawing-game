import React from "react";
import { items } from "./items";
class WebRTCDataChannelDemo extends React.Component {
  state = {
    status: "closed",
    localSDP: "",
    remoteSDP: "",
    history: "",
    random: null,
    theme: "", 
  };

  peerConnectionConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };
  dataChannelOptions = { ordered: false };
  peerConnection = null;
  dataChannel = null;

  componentDidMount() {
    this.setState({ status: "closed" });
  }

  createPeerConnection = () => {
    const pc = new RTCPeerConnection(this.peerConnectionConfig);

    pc.onicecandidate = (evt) => {
      if (evt.candidate) {
        console.log(evt.candidate);
        this.setState({ status: "Collecting ICE candidates" });
      } else {
        this.setState({
          localSDP: pc.localDescription.sdp,
          status: "Vanilla ICE ready",
        });
      }
    };

    pc.onconnectionstatechange = (evt) => {
      switch (pc.connectionState) {
        case "connected":
          this.setState({ status: "connected" });
          break;
        case "disconnected":
        case "failed":
          this.setState({ status: "disconnected" });
          break;
        case "closed":
          this.setState({ status: "closed" });
          break;
        default:
          break;
      }
    };

    pc.ondatachannel = (evt) => {
      this.setupDataChannel(evt.channel);
      this.dataChannel = evt.channel;
    };

    return pc;
  };

  startPeerConnection = () => {
    this.peerConnection = this.createPeerConnection();
    this.dataChannel = this.peerConnection.createDataChannel(
      "test-data-channel",
      this.dataChannelOptions
    );
    this.setupDataChannel(this.dataChannel);

    this.peerConnection
      .createOffer()
      .then((sessionDescription) => {
        console.log("createOffer() succeeded.");
        return this.peerConnection.setLocalDescription(sessionDescription);
      })
      .then(() => {
        console.log("setLocalDescription() succeeded.");
      })
      .catch((err) => {
        console.error("setLocalDescription() failed.", err);
      });

    this.setState({ status: "offer created" });
  };

  setupDataChannel = (dc) => {
    dc.onerror = (error) => {
      console.log("Data channel error:", error);
    };
    dc.onmessage = (evt) => {
      console.log("Data channel message:", evt.data);
      let msg = evt.data;
      this.setState((prevState) => ({
        history: `回答者> ${msg}\n${prevState.history}`
      }));
    };
    dc.onopen = () => {
      console.log("Data channel opened.");
    };
    dc.onclose = () => {
      console.log("Data channel closed.");
    };
  };

  setRemoteSdp = () => {
    const sdptext = this.state.remoteSDP;

    const sdpType = this.peerConnection ? "answer" : "offer";
    const sdp = new RTCSessionDescription({
      type: sdpType,
      sdp: sdptext,
    });

    if (this.peerConnection) {
      this.peerConnection
        .setRemoteDescription(sdp)
        .then(() => {
          console.log("setRemoteDescription() succeeded.");
        })
        .catch((err) => {
          console.error("setRemoteDescription() failed.", err);
        });
    } else {
      this.peerConnection = this.createPeerConnection();
      this.peerConnection
        .setRemoteDescription(sdp)
        .then(() => {
          console.log("setRemoteDescription() succeeded.");
          return this.peerConnection.createAnswer();
        })
        .then((sessionDescription) => {
          console.log("createAnswer() succeeded.");
          return this.peerConnection.setLocalDescription(sessionDescription);
        })
        .then(() => {
          console.log("setLocalDescription() succeeded.");
        })
        .catch((err) => {
          console.error("setLocalDescription() failed.", err);
        });
      this.setState({ status: "answer created" });
    }
  };



  handleMessageChange = (event) => {
    this.setState({ message: event.target.value });
  };

  handleRemoteSdpChange = (event) => {
    this.setState({ remoteSDP: event.target.value });
  };
  componentDidMount() {
    if (this.props.getCanvasData) {
      this.interval = setInterval(this.sendCanvasDataRegularly, 1000); // 1秒ごとにCanvasデータを送信
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval); // クリーンアップ
  }

  sendCanvasDataRegularly = () => {
    const canvasData = this.props.getCanvasData();
    this.sendCanvasData(canvasData);
  };
  sendCanvasData = (canvasData) => {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      const message = JSON.stringify({ type: "image", data: canvasData });
      this.dataChannel.send(message);
    }
  };
  createAnswer = (event) => {
    event.preventDefault();
    const r = Math.floor(Math.random() * items.length);
    console.log(items[r]);
    const theme = items[r];
    this.setState({ theme }); 
    this.setState({ random: r });
    const message = JSON.stringify({ type: "text", data: items[r] });
    console.log(message);
    this.dataChannel.send(message);
  };
  render() {
    return (
      <div>
        <p>
          状態: <input type="text" value={this.state.status} readOnly />
        </p>
        <div>
          <p>(手順1)Start を押し，SDP (offer) を生成する。</p>
          <button type="button" onClick={() => this.startPeerConnection()}>
            Start
          </button>
        </div>
        <p>(手順2)このSDP (offer) をコピーする。</p>
        <textarea
          id="localSDP"
          cols="80"
          rows="5"
          readOnly="readonly"
          value={this.state.localSDP}
        ></textarea>
        <p>(手順5) SDP (answer) を貼り付け Set を押す。</p>
        <textarea
          id="remoteSDP"
          cols="80"
          rows="5"
          value={this.state.remoteSDP}
          onChange={this.handleRemoteSdpChange}
        ></textarea>
        <button type="button" onClick={() => this.setRemoteSdp()}>
          Set
        </button>
        <div>
          <textarea value={this.state.history} readOnly cols="80" rows="10" />
        </div>
        <button onClick={this.createAnswer}>問題を作る</button>
        <p>お題：{this.state.theme}</p>
      </div>
    );
  }
}

export default WebRTCDataChannelDemo;
