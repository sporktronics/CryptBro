# CryptBro

CryptBro is an application for sharing encrypted messages. It's simple
to use, is optimized for use on a mobile device, and works well on
traditional computers too!

It performs all encryption on the client-side, and stores encrypted
messages on the server; no plaintext information is ever seen on the
server.

## How to install

Just extract the archive into your webspace, and make the 'files/'
directory writable. Then create a cron job to access 'cron.php' at
least once an hour. You should also open up 'cryptbro.server.php' and
change the admin email address and the URL. That's it!

