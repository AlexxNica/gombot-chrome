#
#   bundle_for_webstore.py
#
#   This little script outputs a file, gombot-webstore.zip, that should be ready for
#   submission to the Chrome webstore. (https://chrome.google.com/webstore)
#
#   Requires /usr/bin/zip.
#

import json
import os
import shutil
from subprocess import call, PIPE

def bundle():
    # Delete any existing temp directory
    if os.path.isdir('temp'):
        shutil.rmtree('temp')
    
    # Delete any existing zip file
    if os.path.isfile('gombot-webstore.zip'):
        os.unlink('gombot-webstore.zip')
    
    # Copy this directory
    shutil.copytree('.','temp')
    
    # Delete git stuff in temp directory
    if os.path.isdir('temp/.git'):
        shutil.rmtree('temp/.git')
        
    # Delete options page code, it's debug only
    if os.path.isdir('temp/pages/debug_settings'):
        shutil.rmtree('temp/pages/debug_settings')
        
    # Delete node_modules in server; they're unnecessary for client
    if os.path.isdir('temp/server/node_modules'):
        shutil.rmtree('temp/server/node_modules')
        
    # Delete infobar manifest
    os.unlink('temp/infobar/manifest.json')
    
    # Update gombot manifest.json
    changeManifest('temp/manifest.json')
        
    # Zip up temp directory
    call(['/usr/bin/zip', '-r', 'gombot-webstore', 'temp'], stdout=PIPE, stderr=PIPE)
    
    # Delete temp directory
    shutil.rmtree('temp')
    
def changeManifest(manifestFilename):
    manifestData = open(manifestFilename,'r').read()
    manifest = json.loads(manifestData)
    # Remove update_url, web store does its own updating
    if manifest.get('update_url'):
        del manifest['update_url']
    # Remove options page, it's debug-only
    if manifest.get('options_page'):
        del manifest['options_page']
    # Bump up minor version number
    version = map(int,manifest['version'].split('.'))
    version[-1] += 1
    manifest['version'] = '.'.join(map(str,version))
    # Write out modified manifest
    open(manifestFilename,'w').write(json.dumps(manifest))
    

if __name__ == '__main__':
    bundle()