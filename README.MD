# Magic Mirror Wrapper

# Updating the Magic Mirror version

This module uses parts of the magic mirror repository. When a new version of magic mirror releases, you
can update these dependencies using the script below.

```bash
cd backend
rm -rf ./magic-mirror/*.*
mkdir /tmp/mm-clone
cd /tmp/mm-clone
git clone --depth 1 git@github.com:MichMich/MagicMirror.git .
cd -
cp -R /tmp/mm-clone/translations ./magic-mirror
rm -rf /tmp/mm-clone
```
