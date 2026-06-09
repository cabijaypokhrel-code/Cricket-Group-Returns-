/**
 * Live Sharing Module
 * Handles P2P WebRTC sharing via PeerJS
 */

// PeerJS configuration
const PEER_CONFIG = {
  debug: 0,
  reliable: true,
  serialization: 'raw'
};

// Live sharing state
const LIVE = {
  peer: null,
  connections: [],
  currentConnection: null,
  roomCode: null,
  isHosting: false,
  peerJSUrl: 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js'
};

/**
 * Load PeerJS library dynamically
 * @param {Function} callback - Called when library is loaded
 */
function loadPeerJSLibrary(callback) {
  if (typeof window.Peer !== 'undefined') {
    callback();
    return;
  }

  const script = document.createElement('script');
  script.src = LIVE.peerJSUrl;
  script.onload = callback;
  script.onerror = function() {
    console.error('Failed to load PeerJS library');
    showToast('PeerJS unavailable — using link share');
    fallbackToLinkShare();
  };
  document.head.appendChild(script);
}

/**
 * Generate random room code
 * @returns {string} 6-character room code
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Get live share URL
 * @param {string} code - Room code
 * @returns {string} Full live share URL
 */
function getLiveURL(code) {
  return location.href.split('#')[0] + '#live=' + code;
}

/**
 * Encode current game state for sharing
 * @param {Object} state - Current game state
 * @returns {string} Base64 encoded state
 */
function encodeGameState(state) {
  try {
    const stateJson = JSON.stringify(state);
    return btoa(unescape(encodeURIComponent(stateJson)));
  } catch (error) {
    console.error('Error encoding state:', error);
    return '';
  }
}

/**
 * Decode shared game state
 * @param {string} encoded - Base64 encoded state
 * @returns {Object|null} Decoded state object
 */
function decodeGameState(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch (error) {
    console.error('Error decoding state:', error);
    return null;
  }
}

/**
 * Start hosting live room
 * @param {Function} onRoomCreated - Callback when room is created
 * @param {Function} onViewerConnected - Callback when viewer connects
 */
function startHostingRoom(onRoomCreated, onViewerConnected) {
  loadPeerJSLibrary(function() {
    const code = generateRoomCode();

    try {
      const peer = new window.Peer(code, { debug: 0 });

      peer.on('open', function(id) {
        LIVE.peer = peer;
        LIVE.roomCode = id;
        LIVE.isHosting = true;

        const url = getLiveURL(id);
        if (typeof onRoomCreated === 'function') {
          onRoomCreated(id, url);
        }
      });

      peer.on('connection', function(conn) {
        LIVE.connections.push(conn);

        conn.on('open', function() {
          if (typeof onViewerConnected === 'function') {
            onViewerConnected(LIVE.connections.length);
          }
        });

        conn.on('close', function() {
          LIVE.connections = LIVE.connections.filter(c => c !== conn);
        });

        conn.on('error', function(error) {
          console.error('Connection error:', error);
        });
      });

      peer.on('error', function(error) {
        console.error('Peer error:', error);
        // Try again with new code
        setTimeout(startHostingRoom, 500);
      });

    } catch (error) {
      console.error('Error starting host:', error);
      fallbackToLinkShare();
    }
  });
}

/**
 * Broadcast state to all connected viewers
 * @param {Object} state - Current game state
 */
function broadcastStateToViewers(state) {
  if (!LIVE.isHosting || LIVE.connections.length === 0) return;

  const encoded = encodeGameState(state);
  LIVE.connections.forEach(function(conn) {
    try {
      if (conn.open) {
        conn.send(encoded);
      }
    } catch (error) {
      console.error('Broadcast error:', error);
    }
  });
}

/**
 * Join live room as viewer
 * @param {string} code - Room code
 * @param {Function} onStateReceived - Callback when state is received
 * @param {Function} onStatusChange - Callback for connection status
 */
function joinLiveRoom(code, onStateReceived, onStatusChange) {
  loadPeerJSLibrary(function() {
    try {
      const peer = new window.Peer({ debug: 0 });
      LIVE.peer = peer;

      peer.on('open', function() {
        const conn = peer.connect(code, PEER_CONFIG);
        LIVE.currentConnection = conn;

        conn.on('open', function() {
          if (typeof onStatusChange === 'function') {
            onStatusChange('connected');
          }
        });

        conn.on('data', function(encoded) {
          try {
            const state = decodeGameState(encoded);
            if (state && typeof onStateReceived === 'function') {
              onStateReceived(state);
            }
          } catch (error) {
            console.error('Error processing received state:', error);
          }
        });

        conn.on('close', function() {
          if (typeof onStatusChange === 'function') {
            onStatusChange('disconnected');
          }
        });

        conn.on('error', function(error) {
          console.error('Connection error:', error);
          if (typeof onStatusChange === 'function') {
            onStatusChange('error');
          }
        });
      });

      peer.on('error', function(error) {
        console.error('Peer error:', error);
        if (typeof onStatusChange === 'function') {
          onStatusChange('error');
        }
      });

    } catch (error) {
      console.error('Error joining room:', error);
      if (typeof onStatusChange === 'function') {
        onStatusChange('error');
      }
    }
  });
}

/**
 * Fallback to link-based sharing
 */
function fallbackToLinkShare() {
  const encoded = encodeGameState(state);
  const url = location.href.split('#')[0] + '#s=' + encoded;
  shareViaLink(url);
}

/**
 * Share via native share or copy to clipboard
 * @param {string} url - URL to share
 */
function shareViaLink(url) {
  if (navigator.share) {
    navigator.share({
      title: 'Live Cricket Score',
      text: 'View live cricket match',
      url: url
    }).catch(error => console.error('Share error:', error));
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url)
      .then(() => showToast('Link copied to clipboard!'))
      .catch(() => prompt('Share this link:', url));
  } else {
    prompt('Share this link:', url);
  }
}

/**
 * Close current connection
 */
function closeConnection() {
  if (LIVE.currentConnection) {
    LIVE.currentConnection.close();
    LIVE.currentConnection = null;
  }
}

/**
 * Close hosting room
 */
function closeHostingRoom() {
  LIVE.connections.forEach(conn => conn.close());
  LIVE.connections = [];
  if (LIVE.peer) {
    LIVE.peer.destroy();
    LIVE.peer = null;
  }
  LIVE.isHosting = false;
  LIVE.roomCode = null;
}

// Stub for showToast - implement in UI module
function showToast(message) {
  console.log('Toast:', message);
}

export {
  LIVE,
  loadPeerJSLibrary,
  generateRoomCode,
  getLiveURL,
  encodeGameState,
  decodeGameState,
  startHostingRoom,
  broadcastStateToViewers,
  joinLiveRoom,
  fallbackToLinkShare,
  shareViaLink,
  closeConnection,
  closeHostingRoom
};
