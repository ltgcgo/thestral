#!/usr/bin/bash
while : ; do
	deno run --allow-read --allow-net --unstable index.js $1 $2
done
exit
