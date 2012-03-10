# CryptBro

CryptBro is a tool for sharing encrypted messages. All encryption is
performed on your own computer using the
[AES](http://en.wikipedia.org/wiki/Advanced_Encryption_Standard)
encryption algorithm, used by the US Government and SSL servers
everywhere for secure communications. You can be quite sure no one but
the intended recipient can read your message, as long as common-sense
security protocols are followed.

## How do I install it?

Just extract the archive into your webspace, and make the 'files/'
directory writable. Then create a cron job to access 'cron.php' at
least once an hour. You should also open up 'cryptbro.server.php' and
change the admin email address and the URL. That's it!

## How does it work?

It's quite simple. There are two modes of operation, Encrypt and
Decrypt. To encrypt a message, click Encrypt, pick a passphrase for
your shared key, type your message, and click Crypt. Your message is
first encrypted, then the encrypted message is sent to the server to
be saved. You are then given a URL which you can send to the recipient
where they can read the message.

When your recipient opens the link you've sent them, they are shown
the encrypted text. They will then type the key you've shared with
them, and click Crypt.

You also have the option of registering. If you do so, you'll be able
to send and receive messages with other users without needing to share
links. Simply have them check their Inbox.

## How can I be sure it's secure? Are you sure nobody can read my message? ##

Nothing is transmitted to the server in plaintext. Because all
encryption is performed on your own computer, you can be sure the
message is as secure as your computer is, as long as common-sense
security protocols are followed.

To know if your message is secure, start by asking yourself these
questions:

* "Is my key based on a dictionary word or something easy to guess?"
* "Are there any spyware or keyloggers on my system?"
* "Could anyone have access to the key that shouldn't?"

Answering negatively to these and perhaps other questions should
assure you of your message's security.

## What's the deal with logging in? What info do you want from me?

We don't want any of your info! Logging in is purely optional and only
serves to facilitate sharing messages between users. If you choose to
register, you'll enter a username, password, and email address. We
don't verify the address. We send you a message when you join and when
another user sends you a message so you know to pick it up.

## What's really going on under the hood?

Once you've entered your key and message and submit the form, CryptBro
takes the key and
[stretches](http://en.wikipedia.org/wiki/Key_stretching) it using the
[PBKDF2](http://en.wikipedia.org/wiki/PBKDF2) algorithm. With this
key, it then makes an [HMAC](http://en.wikipedia.org/wiki/HMAC)
[hash](http://en.wikipedia.org/wiki/Hash_function) of the
message. Finally, the message is AES encrypted. The encrypted message,
the HMAC hash, and the
[salt](http://en.wikipedia.org/wiki/Salt_&#40;cryptography&#41;) for
the stretched key are rolled up together, and sent to the server for
storage (if the user does not disable server-side storage).

On the decryption side, CryptBro takes the rolled-up message, gets the
salt, and stretches the key to obtain the same stretched key it was
encrypted with. It then makes an HMAC hash and checks it against the
original hash; this is checks that the user supplied the correct
key. If the hash is right, the message is decrypted and displayed.