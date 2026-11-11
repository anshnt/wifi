# Home Wi-Fi board

One page that shows how a home network is doing: router radios, every client's signal, fiber uptime, reconnect history, what to change, and a log of each action taken.

Live copy: https://anshnt.github.io/wifi/

## What it found

- The fiber line is healthy: 2 days 22 hours up, no WAN errors, 7 ms to the internet, 0% loss.
- Coverage is the weak link: phones read -68 to -82 dBm on 5 GHz with router power already at 100%.
- One device made 24 of 36 reconnect events in the router's 10-hour log.
- The laptop had no unplanned Wi-Fi drops in 4 days; moving it to 5 GHz raised download from 90-100 to 157-174 Mbps.

The full fix list, in order of effect, is on the board.

## Live mode

Opened as a Claude artifact inside the Claude desktop app, the board can read the router through Claude's own browser every 30 seconds (sign in at `192.168.1.1` there first; the router signs out after 5 idle minutes). Anywhere else, including GitHub Pages, it shows the snapshot.

## Privacy

The public copy holds no network name, hardware address, public IP or ISP account. `node test/check.mjs` tests the parsers and fails if any of those appear; CI runs it on every push.
