<?php

function rglob($pattern = '*', $flags = 0, $path = '') {
  $paths = glob($path.'*', GLOB_MARK|GLOB_ONLYDIR|GLOB_NOSORT);
  $files = glob($path.$pattern, $flags);

  foreach ($paths as $path) {
    $files = array_merge($files, rglob($pattern, $flags, $path));
  }

  return $files;
}

function deleteExpired() {
  $headers = rglob('*.header', 0, 'files/');
  $expired = array();
  $time = time();

  foreach ($headers as $file) {
    $fileNoExt = substr($file, 0, -7);
    $header = json_decode(file_get_contents($file))->header;
//  echo (filemtime($file) + $header->expires)." $time\n";
    if (filemtime($file) + $header->expires < $time && $header->expires) {
//    echo "delete $fileNoExt\n";
      unlink("$fileNoExt.bro");
      unlink("$fileNoExt.header");
    } else {
//    echo "$fileNoExt not expired\n";
    }		  
  }
}

deleteExpired();

?>