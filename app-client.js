// app-client.js
import { map, uniq, filter } from 'lodash';
import React, { Component } from 'react';
import { render } from 'react-dom';
import io from 'socket.io-client';
import uuid from 'node-uuid';
import {
  PageHeader, Grid, Col, Panel, Input,
  Label, ListGroup, ListGroupItem, Navbar
} from 'react-bootstrap';


const socket = io('http://localhost:3000/');

class App extends Component {
  constructor() {
    super()
    this.state = {
      messages: [],
      typingList: []
    }
  }

  componentDidMount() {
    socket.on('chat-msg', message => {
      console.log('listener client: ', message);
      if (message.user !== this.state.author) {
        // update state here based on server communication
        this.setState((prevState) => {
          return {
            messages: [...prevState.messages, message],
            offline: false
          };
        });
      }
    });

    socket.on('user-offline', (userId) => {
      console.log('user disconnected: ', userId);
      // update the state
      this.setState((prevState) => {
        return {
          messages: map(prevState.messages, msg => {
            return Object.assign({}, msg, { offline: msg.id === userId });
          })
        };
      });
    });

    socket.on('user-typing', (user) => {
      console.log('user typing: ', user);
      // update the state
      this.setState((prevState) => {
        return {
          typingList: filter(uniq([...prevState.typingList, user]),
            userInList => userInList !== prevState.author
          )
        };
      });
    });

    socket.on('user-not-typing', (user) => {
      console.log('user not typing: ', user);
      // update the state
      this.setState((prevState) => {
        return {
          typingList: filter(uniq([...prevState.typingList, user]),
            userInList => userInList !== user
          )
        };
      });
    });

    this.refs.author.refs.input.focus();
  }

  componentDidUpdate() {
    console.log('did update');
    console.log('what is state now: ', this.state.messages);
    if (this.refs.chatbox) {
      this.refs.chatbox.refs.input.focus();
      this.refs.chatContainer.scrollTop = this.refs.chatContainer.scrollHeight
    }
  }

  createMessage(entry) {
    // Send message out to server
    console.log('what is entry?: ', entry);
    socket.emit('chat-msg', entry);

    // client state update
    this.setState((prevState) => {
      return {
        messages: [...prevState.messages, entry],
        offline: false
      };
    });
  }

  userTyping(user) {
    socket.emit('user-typing', user);
  }

  userNotTyping(user) {
    socket.emit('user-not-typing', user);
  }

  insertChat = (ev) => {
    const message = ev.target.value;
    if (ev.which === 13 || ev.keyCode === 13) {
      this.createMessage({
        user: this.state.author,
        message
      });
      this.refs.chatbox.refs.input.value = '';
    } else
      this.userTyping(this.state.author);

    window.setTimeout(() => {
      this.userNotTyping(this.state.author);
    }, 3000);
  }


  createUser = (ev) => {
    const author = ev.target.value;
    if (ev.which === 13 || ev.keyCode === 13) {
      this.setState(() => {
        return {
          author
        };
      });
      this.refs.author.refs.input.value = '';
    }
  }

  registerUser() {
    return (
      <div>
        <Col md={4}>
          <Panel header="Create a User">
            <Input type="text" onKeyDown={this.createUser} ref="author"/>
          </Panel>
        </Col>
      </div>
    );
  }

  renderChats() {
    console.log('render');
    const { typingList } = this.state;
    return (
      <div>
        <Navbar fixedBottom>
            <h4>Type your Message <i>{this.state.author}</i></h4>
            <Input type="text" onKeyDown={this.insertChat} ref="chatbox"/>
            <p>{ typingList.length > 0 ? <i>{ typingList.join(',') } typing...</i> : null }</p>
        </Navbar>

        <Col md={8} className="chat-container" ref="chatContainer">
          <ListGroup>
            {
              this.state.messages.map(item => {
                return (
                  <ListGroupItem key={uuid.v1()}>
                    <Label bsStyle={item.offline ? 'danger' : 'success'}>{item.user}</Label>
                    <span className="user-comment">{item.message}</span>
                  </ListGroupItem>
                );
              })
            }
          </ListGroup>
        </Col>
      </div>
    );
  }

  render() {
    console.log('typing users: ', this.state.typingList);
    const pageContent = this.state.author ? this.renderChats() : this.registerUser();
    return (
      <div>
        <PageHeader>Flack</PageHeader>
        <Grid>
          {pageContent}
        </Grid>
      </div>
    )
  }
}

const app = document.getElementById('app')
render(<App />, app)
