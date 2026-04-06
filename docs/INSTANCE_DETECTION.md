# 🔍 Server Instance Detection - Technical Details

## Current Behavior

### What Works ✅
- OTEA tracks servers **launched via OTEA UI**
- Button "Rafraîchir" (Surveillance) shows:
  - Port number
  - Status (running/stopped)
  - Uptime (if launched via OTEA)
  - **Source tag: "OTEA"** (new in v2.1)

### What Doesn't Work ❌
- **Auto-discovery of independent Arma instances**
- Cannot detect servers started manually or by other tools
- No scanning of active ports
- No UDP probing of Arma servers

---

## Why No Auto-Discovery?

### Current Architecture Limitation

```
Instance Detection Methods:

1. ✅ MEMORY TRACKING (Current)
   runningServers = {
     "2301": { proc, uptime, ... },
     "2302": { proc, uptime, ... }
   }
   → Simple, instant, no overhead
   → But: only OTEA-launched servers
   → Lost on OTEA restart

2. ❌ PORT SCANNING (Not implemented)
   netstat -ano | findstr :PORT
   OR
   lsof -i :PORT
   → Time-consuming on large port ranges
   → OS-dependent (Windows/Linux different)
   → Requires elevated privileges sometimes
   → Still can't confirm if it's Arma or other service

3. ❌ UDP PROBING (Not implemented)
   Send Arma query to port → Parse response
   → More accurate detection
   → But requires Arma server protocol knowledge
   → Still needs Arma binary to confirm
```

---

## Proposed Future Implementation

### Phase 1: Simple Port Scanner (v2.2)

```javascript
// Scan configured default ports: 2301-2399
// Execute: netstat -ano | findstr :PORT (Windows)
// Or: lsof -i :PORT (Linux)

const SCAN_PORTS = [2301, 2302, 2303, 2304, 2305];
const detected = [];

for (const port of SCAN_PORTS) {
    // Execute netstat/lsof
    // Check if port is LISTENING
    // Add to detected list
    detected.push({
        port: port,
        running: true,
        source: 'Detected'
    });
}

// Merge with OTEA-launched servers
const allServers = [...otealocal, ...detected];
```

**Pros:**
- Easy to implement
- Works on all platforms
- Instantly shows active ports

**Cons:**
- Can't confirm it's Arma (could be other service)
- Doesn't show uptime
- Doesn't show player count

---

### Phase 2: Arma Protocol Detection (v2.3)

```javascript
// Send Arma query packet to port
// Format: 01 00 00 00 00...
// Arma server responds with metadata

const sendArmaProbe = (port) => {
    const socket = dgram.createSocket('udp4');
    const query = Buffer.from([0x01, 0x00, 0x00, 0x00]);
    
    socket.send(query, port, 'localhost', (err) => {
        if (err) return null;
    });
    
    socket.on('message', (msg) => {
        // Parse Arma response
        return {
            port: port,
            running: true,
            playerCount: parseResponse(msg).players,
            mission: parseResponse(msg).mission
        };
    });
};
```

**Pros:**
- Definitively confirms it's Arma
- Gets live server info (players, mission)
- More accurate

**Cons:**
- UDP communication complexity
- Arma protocol may change between versions
- Still requires port scanning first

---

### Phase 3: Full Auto-Discovery (v2.4)

Combine all approaches:

```
1. Track OTEA-launched servers (memory) ← Current
2. Scan configured port range (netstat/lsof) ← Phase 1
3. Probe detected ports with Arma query ← Phase 2
4. Merge & deduplicate results
5. Return unified server list

Result:
{
  port: 2301,
  running: true,
  source: "OTEA",           // Launched via OTEA
  uptime: "5h 23m",
  players: 12/64
}

{
  port: 2302,
  running: true,
  source: "Detected",       // Found via port scan
  uptime: "Unknown",
  players: 8/32             // From Arma probe
}
```

---

## Challenges & Considerations

### Performance
- Scanning all ports on startup = slow (100ms+)
- UDP probing for each port = network delay
- Solution: Scan only configured range + cache results

### Platform Differences
- Windows: `netstat -ano | findstr`
- Linux: `lsof -i` or `ss -tulpn`
- macOS: `lsof -i` or `netstat -a`
- Solution: Use osAbstraction layer (already in place!)

### Permission Issues
- Some systems require root/sudo for netstat/lsof
- Solution: Run command, catch errors gracefully

### Identifying Arma vs Other Services
- Port 2302 could be: Arma, Apache, MySQL, etc.
- Solution: Use UDP probing to confirm

---

## Current State (v2.1)

**Endpoint:** `GET /api/servers-status`

**Response:**
```json
[
  {
    "port": "2301",
    "running": true,
    "uptime": "5h 23m",
    "source": "OTEA"
  }
]
```

**Code (server.js:390):**
```javascript
// IMPROVED: Shows servers launched via OTEA
// Code for Phase 1 detection is commented out (ready to enable)
// Uncomment to activate port scanning
```

---

## How to Enable Port Scanning (Phase 1)

### Step 1: Uncomment detection code in server.js
```javascript
// Search for: "TODO: Scanner les ports"
// Uncomment the commented block below
```

### Step 2: Choose your port range
```javascript
const ARMA_PORTS = [2301, 2302, 2303, 2304, 2305];
// Adjust based on your infrastructure
```

### Step 3: Test
```bash
# Start OTEA
node js/server.js

# Launch Arma server independently (not via OTEA)
./ArmaReforgerServer -config config.json -port 2304

# Click "Rafraîchir" (Surveillance)
# Should show port 2304 with source: "Detected"
```

---

## Next Steps

- [ ] **v2.2:** Implement Phase 1 (port scanning)
- [ ] **v2.3:** Implement Phase 2 (Arma protocol probing)
- [ ] **v2.4:** Implement Phase 3 (unified discovery)
- [ ] **v2.5:** Add UI indicators for detected vs. OTEA-launched
- [ ] **v2.6:** Background refresh (auto-scan every 30s)

---

## Questions & Answers

**Q: Why not auto-detect in v2.1?**
A: Requires careful implementation + testing on multiple platforms. Better to comment code in v2.1 and release v2.2 with thorough testing.

**Q: Does it work if Arma is on different machine?**
A: No - current design assumes local network. Future versions could support remote scanning via SSH.

**Q: Performance impact?**
A: Minimal - port scanning only runs on-demand (button click) or every 30s (background refresh - future).

**Q: Can I just scan all 65535 ports?**
A: No - would take 30+ seconds. Scan only configured range (e.g., 2300-2399).

---

**Version:** v2.1 (Foundation ready for future detection)  
**Status:** Documented & Code commented for Phase 1  
**Next Release:** v2.2 (Port scanning implementation)
