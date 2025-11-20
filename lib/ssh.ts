import SSH from 'simple-ssh';

export interface SshConfig {
  host: string;
  port?: number;
  username: string;
  password: string;
}

export async function executeShutdown(sshConfig: SshConfig): Promise<boolean> {
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