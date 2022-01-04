## What?

Some scripts that will help you deal with launching instances, ssh-ing into them, scp-ing files onto them, etc.

Assumes that you have your `.pem` file at `~/.ssh/nekonekocdk.pem`.

If you need to use a different AWS `--profile` then you'll have to add that to the scripts.

## Flow

1. `./neko-launch-ff.sh` or `./neko-launch-vlc.sh`
2. `./neko-open.sh` - only works on Mac, otherwise just manually open the URL the script spits out.
3. Enjoy the show!
4. `./neko-terminate.sh`
