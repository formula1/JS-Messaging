# Abstract Types Provided

- Messenger
  - Must overwrite its write calls and notify it that it has a new message
  - Subclasses
    - Proxy Messenger - Simply passes on its data to another
    - Recoverable Messenger - If it disconnects, will store messages and attempt to reconnect
    - Distributed Messenger - Uses not one but multiple individuals as possibly the same peer
- Manager
  - Must provide it with a Messenger class and notify it when there is a possible Messenger available
  - Subclasses
    - Proxy Manager
    - Worker Manager - Recieves whatever another manager gives it.
    - Permitted Manager - Requires a enabling manager to allow it to recieve or create clients
    - Enabling Manager - Provides a Permitted Manager with clients they can see and request
- Enabler
  - A Manager type that facilitates Messengers knowing about eachother

# Features I'd like to ensure exist
- Machines can change IP and still effectively communicate with one another over UDP
  - This involves maintaining a Pong/Pong with a unique Identifier
- Machines can go offline then come back online as the same individual
  - This involves maintaining a queue when 'not ready'

# Implementations Intended to be Provided

- Child to Parent
  - Child creates connecton - Websocket (Client/Server)
  - Parent creates connection - ChildProcess, WebWorkers
- Peer to Peer
  - Requires a Parent to connect - WebRTC (CLient to Client)
  - Requires Knowledge of the Peer Existing (usually a parent or dev) - TCP / UDP (Server to Server)
  - Easily Listable Peer - IFrame, SharedWorker, node-auxillary (Process to Process)

# Managers Required
- Scanner
  - Server Scanner - Given a Subnet Mask and IP + Port will attempt to scan the IP for at least one possible peer.
  - Process Scanner
    - Server - If the server writes things to files, so long as the files are in the same centralized area. No problem
    - Client - I'll have to look more into this
- Child to Parent
  - Client Listener - Websocket listening
  - Process Factory - Child Process / WebWorker creation
- Peer to Peer
  - WebRTC Facilitator - Implemented Serverside
  - WebRTC Factory - Implemented Clientside as a means to create one. Without a connection to the server it is impossible to connect to other peers. As a result, there needs to be a common area to discover
  - Remote Peer Listener - Allows other peers to connect to you or discover you.
  - Server Process Listener
    - This eats up the stdin or a predictable filepath to watch for potential messages posted to it.
  - Client Process listener
    - Shared Worker implementation. This needs to manage specific requests and send it to the correct clients
    - Techinically this is 'udp' in that there is no Connection established and maintained
