const socket = io();

let textarea = document.querySelector('#textarea');
let messageArea = document.querySelector('.message-area');
let sender = senderId;
let receiver = receiverId;
let username = nme;

console.log('Sender:', sender); // Debugging line
console.log('Receiver:', receiver); // Debugging line

// Ensure senderId and receiverId are available globally
if (typeof senderId === 'undefined' || typeof receiverId === 'undefined' || typeof nme === 'undefined') {
    console.error('senderId, receiverId, or nme is not defined');
} else {
    // Join the chat room
    let sender = senderId;
    let receiver = receiverId;
    console.log(sender, receiver);
    socket.emit('joinRoom', { seekerID: sender, providerID: receiver });

    // Listen for chat history
    socket.on('chatHistory', (messages) => {
        console.log('Chat history:', messages); // Debugging line
        messages.forEach(msg => appendMessage(msg, msg.sender === senderId ? 'outgoing' : 'incoming', flag ='true'));
        scrollToBottom();
    });

    // Event listener for sending messages
    textarea.addEventListener('keyup', (e) => {
        if (e.key === "Enter") {
             console.log('Enter key detected'); // Debugging line
            sendMessage(e.target.value);
        }
    });

    // Function to send a message
    function sendMessage(message) {
        console.log('Inside sendMessage function');
        let msg = {
            user: nme,
            sender: senderId,
            receiver: receiverId,
            message: message.trim()
        };

        console.log('Sending message:', msg); // Debugging line

        // Append the outgoing message to the UI
        appendMessage(msg, 'outgoing', flag = 'false');
        textarea.value = "";
        scrollToBottom();

        // Sending the message to the server
        socket.emit('message', msg);
    }

    // Function to append a message to the UI
    function appendMessage(msg, type, flag) {
        console.log('Appending message:', msg); // Debugging line

        let mainDiv = document.createElement('div');
        let className = type;
        mainDiv.classList.add(className, 'message');
        let markup;
        if (flag == 'true') {
         markup = `
                      <p>${msg.content}</p>`;
        }else{
             markup = `<h4>${msg.user}</h4>
                      <p>${msg.message}</p>`;
        }
        mainDiv.innerHTML = markup;
        messageArea.appendChild(mainDiv);
    }

 
    socket.on('message', (msg) => {
        console.log('Received message:', msg); // Debugging line
        
        // Determine the type of message (outgoing or incoming)
        const messageType = (msg.sender === senderId) ? 'outgoing' : 'incoming';
        let flag;
        if (messageType === 'outgoing'){
            flag = 'false';
        }
        else{
            flag = 'true';
        }
        // Append the message to the UI with the appropriate type
        appendMessage(msg, messageType, flag);
        scrollToBottom();
    });
    // Function to scroll to the bottom of the message area
    function scrollToBottom() {
        messageArea.scrollTop = messageArea.scrollHeight;
    }
}