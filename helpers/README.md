## What?

Some scripts that will help you deal with launching instances, ssh-ing into them, scp-ing files onto them, etc.

Assumes that you have your `.pem` file at `~/.ssh/nekonekocdk.pem`.

If you need to use a different AWS `--profile` then you'll have to add that to the scripts.

## Scripts

1. `./neko-launch-ff.sh` - Launches neko with Firefox for watching videos on YouTube, Netflix, anything that can viewed in a browser!
2. `./neko-launch-vlc.sh` - Launches neko with VLC for watching your own video files.
3. `./neko-ssh.sh` - Finds the neko instance you have launched and SSHes into it. Only works if you have one instance launched.
4. `./neko-vlc-scp.sh` - SCPs files to the `/video` directory for viewing in VLC.
5. `./neko-open.sh` - only works on Mac to open the URL to your neko instance. Otherwise just manually open the URL the script spit out.
6. `./neko-terminate.sh` - Terminates the running instance.
