import React from "react";

import { db } from "../../../fire";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
// import {
//   Stack,
//   Button,
//   Card,
//   CardContent,
//   Typography,
//   CardActions,
// } from "@mui/material";

import styles from "./page.module.css";


class WebRTCDataChannelDemo extends React.Component {
  state = {
    status: "closed",
    localSDP: "",
    remoteSDP: "",
    history: "",
    message: "",
    sentMessage: "",
    answerMessage: "",
  };

  peerConnectionConfig = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  };
  dataChannelOptions = { ordered: false };
  peerConnection = null;
  dataChannel = null;
  unSubscribeLocal = null;

  componentDidMount() {
    this.setState({ status: "closed" });
    this.unSubscribeLocal = onSnapshot(doc(db, "room1", "localSDP"), (doc) => {
      if (doc.data().offer !== "") this.setRemoteSdp(doc.data().offer);
      console.log("Current data:", doc.data().offer);
    });
  }
  componentWillUnmount() {
    if (this.unSubscribeLocal) {
      this.unSubscribeLocal();
    }
  }
  createPeerConnection = (room) => {
    const pc = new RTCPeerConnection(this.peerConnectionConfig);

    pc.onicecandidate = async (evt) => {
      if (evt.candidate) {
        console.log(evt.candidate);
        this.setState({ status: "Collecting ICE candidates" });
      } else {
        this.setState({
          localSDP: pc.localDescription.sdp,
          status: "Vanilla ICE ready",
        });
        const local = { answer: pc.localDescription.sdp };
        await updateDoc(doc(db, "room1", "remoteSDP"), local);
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
      const receivedMessage = JSON.parse(evt.data);
      if (receivedMessage.type === "image") {
        this.updateCanvas(receivedMessage.data);
      } else if (receivedMessage.type === "text") {
        console.log("答え:", receivedMessage.data);
        this.setState({ answerMessage: receivedMessage.data }, () => {
          console.log("answerMessage:", this.state.answerMessage);
        });
      }
    };

    dc.onopen = () => {
      console.log("Data channel opened.");
    };
    dc.onclose = () => {
      console.log("Data channel closed.");
    };
  };

  setRemoteSdp = (SDP) => {
    const sdptext = SDP;

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



  sendMessage = (event) => {
    event.preventDefault();
    const { message } = this.state;
    if (
      !this.peerConnection ||
      this.peerConnection.connectionState !== "connected"
    ) {
      alert("PeerConnection is not established.");
      return;
    }
    if (this.dataChannel) {
      this.dataChannel.send(message);
      const { answerMessage} = this.state;
      console.log("送信:", message);
      console.log("答え:", answerMessage);
      if (answerMessage === message) {
        this.setState((prevState) => ({
          history: `正解! \n${prevState.history}`,
        }));
      }
    }
    this.setState((prevState) => ({
      message: "",
      history: `me> ${message}\n${prevState.history}`,
    }));
  };

  handleMessageChange = (event) => {
    this.setState({ message: event.target.value });
  };

  handleRemoteSdpChange = (event) => {
    this.setState({ remoteSDP: event.target.value });
  };
  constructor(props) {
    super(props);

    // canvasの参照を作成
    this.canvasRef = React.createRef();
  }

  // canvas要素に画像を描画する関数
  updateCanvas = (dataURL) => {
    const canvas = this.canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      const image = new Image();
      image.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
      };
      // Data URLを画像ソースとしてセット
      image.src = dataURL;
    }
  };

  render() {
    return (
      <div>
        <p>
          状態: <input type="text" value={this.state.status} readOnly />
        </p>
        {/* <p>(手順3) (offer) を貼り付け Set を押す</p>
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
        <p>(手順4) このSDP (answer) をコピーする。</p>
        <textarea
          id="localSDP"
          cols="80"
          rows="5"
          readOnly="readonly"
          value={this.state.localSDP}
        ></textarea> */}

        <h3>回答の送信</h3>
        <form onSubmit={this.sendMessage}>
          <input
            type="text"
            value={this.state.message}
            onChange={this.handleMessageChange}
            size="30"
          />
          <input type="submit" value="Send" />
        </form>
        <div>
          <textarea value={this.state.history} readOnly cols="80" rows="10" />
        </div>
        <canvas
          ref={this.canvasRef}
          width="800"
          height="500"
          className={styles.canvas}
        />
      </div>
    );
  }
}

export default WebRTCDataChannelDemo;
