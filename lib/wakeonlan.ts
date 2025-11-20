import wol from 'wol';

export async function wakeOnLan(macAddress: string, broadcastAddress: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Validate MAC address format
      if (!isValidMacAddress(macAddress)) {
        console.error('Invalid MAC address format:', macAddress);
        resolve(false);
        return;
      }

      // Wake up the device using the wol library
      wol.wake(macAddress, {
        address: broadcastAddress,
        port: 9
      }, (error) => {
        if (error) {
          console.error('Failed to send Wake-on-LAN packet:', error);
          resolve(false);
        } else {
          console.log(`Wake-on-LAN packet sent to ${macAddress} via ${broadcastAddress}`);
          resolve(true);
        }
      });

    } catch (error) {
      console.error('Wake-on-LAN error:', error);
      resolve(false);
    }
  });
}

function isValidMacAddress(mac: string): boolean {
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return macRegex.test(mac);
}