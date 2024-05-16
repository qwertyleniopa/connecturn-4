# Connecturn 4

Connect 4 with a board rotation gimmick. That's literally it. Uses [PeerJS](https://peerjs.com/) to connect players via invite link. Since there is no TURN surver used here, it may be impossible to connect with some players.

## Note

This project is left unfinished since the concept may not be worth completing. There seems to be minimal incentive to actually use the board rotation gimmick, rendering the concept kind of contrived. Some aspects of the design have to be tweaked first before something like this can be more viable.

### (Incomplete) Unfinished Features List

- Peer connection design is rather questionable (some tight coupling, lack of logs, incomplete types, etc.)
- Anticheat (a player can probably act for another player if they send the right message to the game host)
- Visual design, and robustness across a majority of devices (some text is not visible on mobile browsers)
- More robust error handling
