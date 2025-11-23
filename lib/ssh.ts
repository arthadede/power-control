import SSH from 'simple-ssh';

export interface SshConfig {
  host: string;
  port?: number;
  username: string;
  password: string;
  localIPAddress?: string; // Local network IP (192.168.0.*) for direct access
  jumpHost?: {
    host: string;
    port?: number;
    username: string;
    password: string;
  };
}

export async function executeShutdown(sshConfig: SshConfig): Promise<boolean> {
  // Try local network IP first if available
  if (sshConfig.localIPAddress) {
    console.log(`Attempting connection via local network: ${sshConfig.localIPAddress}`);
    const localConfig = {
      ...sshConfig,
      host: sshConfig.localIPAddress,
      jumpHost: undefined // Don't use jump host for local network
    };

    const localResult = await executeShutdownDirect(localConfig);
    if (localResult) {
      console.log('Successfully connected via local network');
      return true;
    }

    console.log('Local network connection failed, falling back to VPN...');
  }

  // If local network failed or not available, use VPN with jump host if configured
  if (sshConfig.jumpHost) {
    return executeShutdownViaJumpHost(sshConfig);
  }

  // Otherwise, execute shutdown directly to VPN address
  return executeShutdownDirect(sshConfig);
}

function executeShutdownDirect(sshConfig: SshConfig): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      console.log(`Connecting to SSH server at ${sshConfig.host}:${sshConfig.port || 22}`);

      const ssh = new SSH({
        host: sshConfig.host,
        port: sshConfig.port || 22,
        user: sshConfig.username,
        pass: sshConfig.password,
        timeout: 10000, // 10 seconds timeout
      });

      // Execute shutdown command with a 1-minute delay for safety
      // Try with sudo first since shutdown typically requires root privileges
      ssh.exec('echo "' + sshConfig.password + '" | sudo -S shutdown -h +1 "System shutdown initiated by Power Control"', {
        out: console.log,
        err: console.error,
        exit: (code: number) => {
          console.log(`SSH command completed with code ${code}`);

          if (code === 0) {
            console.log(`Shutdown command sent successfully to ${sshConfig.host}`);
            resolve(true);
          } else {
            console.error(`Shutdown command failed with code ${code}`);
            resolve(false);
          }
        }
      }).start({
        exit: (code: number) => {
          console.log(`SSH connection closed with code ${code}`);
          if (code !== 0 && code !== undefined) {
            resolve(false);
          }
        },
        ready: () => {
          console.log(`SSH connection established to ${sshConfig.host}`);
        },
        error: (err: Error) => {
          console.error('SSH connection error:', err);
          resolve(false);
        }
      });

    } catch (error) {
      console.error('SSH connection or command error:', error);
      resolve(false);
    }
  });
}

function executeShutdownViaJumpHost(sshConfig: SshConfig): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const jumpHost = sshConfig.jumpHost!;
      console.log(`Connecting to jump host at ${jumpHost.host}:${jumpHost.port || 22}`);
      console.log(`Target device: ${sshConfig.host}:${sshConfig.port || 22}`);

      const ssh = new SSH({
        host: jumpHost.host,
        port: jumpHost.port || 22,
        user: jumpHost.username,
        pass: jumpHost.password,
        timeout: 10000, // 10 seconds timeout
      });

      // Build the SSH command to execute on the jump host that connects to the target
      // Use sshpass to handle password authentication in the nested SSH command
      const targetPort = sshConfig.port || 22;
      const shutdownCommand = `echo "${sshConfig.password}" | sudo -S shutdown -h +1 "System shutdown initiated by Power Control"`;

      // The command to run on the jump host
      // We use sshpass to provide password for the nested SSH connection
      const command = `sshpass -p '${sshConfig.password}' ssh -o StrictHostKeyChecking=no -p ${targetPort} ${sshConfig.username}@${sshConfig.host} '${shutdownCommand}'`;

      console.log(`Executing shutdown command through jump host for ${sshConfig.host}`);

      ssh.exec(command, {
        out: (stdout: string) => {
          console.log('Jump host output:', stdout);
        },
        err: (stderr: string) => {
          console.error('Jump host error:', stderr);
        },
        exit: (code: number) => {
          console.log(`Jump host command completed with code ${code}`);

          if (code === 0) {
            console.log(`Shutdown command sent successfully to ${sshConfig.host} via jump host`);
            resolve(true);
          } else {
            console.error(`Shutdown command failed with code ${code}`);
            resolve(false);
          }
        }
      }).start({
        exit: (code: number) => {
          console.log(`Jump host SSH connection closed with code ${code}`);
          if (code !== 0 && code !== undefined) {
            resolve(false);
          }
        },
        ready: () => {
          console.log(`SSH connection established to jump host ${jumpHost.host}`);
        },
        error: (err: Error) => {
          console.error('Jump host SSH connection error:', err);
          resolve(false);
        }
      });

    } catch (error) {
      console.error('Jump host SSH connection or command error:', error);
      resolve(false);
    }
  });
}