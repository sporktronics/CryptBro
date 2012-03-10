<?php

require('ssauth.php');
require('ssrpc.server.php');

$config['adminEmail'] = 'CryptBro <admin@cryptbro.com>';
$config['url'] = 'https://cryptbro.com/';

function getNewId() {
  return dec2base62(round(microtime(true)*10000));
}

function dec2base62($num) {
  $chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  $base = strlen($chars);
  $str = '';
  
  do {
    $i = fmod($num, $base);
    $str = $chars[$i] . $str;
    $num = ($num - $i) / $base;
  } while($num > 0);
  
  return $str;
}

function register($user, $pass, $email) {
  global $ssrpc, $auth, $config;
  
  if (!empty($user) && !empty($pass) && !empty($email)) {
    
    try {
      if ($auth->register($user, $pass, $email)) {
	$ssrpc->info('register', "User $user registered. You may now log in.");
	$ssrpc->data('register', $user);	

	$auth->emailToUser($user, $config['adminEmail'], 'Welcome to CryptBro!', 
			   "Dear $user,

Thanks for signing up at $config[url] ! You'll now get emails whenever
someone leaves you a message.

Signed,
CryptBro Admin");

      } else {
	$ssrpc->error('register', "User $user already exists");
      }
    } catch (Exception $e) {
      $ssrpc->error('register', $e->getMessage());
    }
  } else {
    $ssrpc->error('register', 'Registration requires a username, password, and email address');
  }
}

function login($user, $pass) {
  global $ssrpc, $auth;
  
  if (!empty($user) && !empty($pass)) {
    
    try {
      if ($auth->login($user, $pass)) {
	$ssrpc->data('login', $user);
	$ssrpc->info('login', "Welcome $user");
      } else {
	$ssrpc->data('logout', 'loginFail');
	$ssrpc->error('login', 'Username and/or password incorrect');	
      }
    } catch (Exception $e) {
      $ssrpc->error('login', $e->getMessage());
    }
    
  }
  return false;
}

function logout() {
  global $ssrpc, $auth;
  
  $auth->logout();
  $ssrpc->data('logout', 'logout');
  $ssrpc->info('logout', 'Logged out');
}

function saveBro($bro, $id, $dir) {
  $header = $bro;
  unset($header['message']);

  return (file_put_contents("$dir/$id.bro", json_encode(array('bro' => $bro))) &&
	  file_put_contents("$dir/$id.header", json_encode(array('header' => $header))));
}

function save($message, $expires, $to) {
  global $ssrpc, $auth;

  if (!empty($message)) {

    $id = getNewId();
    $bro = array( 'message' => $message );
    
    if (empty($expires) || $expires < 0 || !is_numeric($expires)) {
      $expires = false;
    }

    $bro['expires'] = $expires;    
    $saveDir = $auth->getUsersDir();

    if ($auth->isLoggedIn()) {

      $bro['from'] = $auth->getLoggedInUser();

      if (!empty($to)) {
	if ($auth->userExists($to)) {
	  $bro['to'] = $to;
          $saveDir = $auth->getDirForUser($bro['from']);
	  $toDir = $auth->getDirForUser($to);

	  if (!saveBro($bro, $id, $toDir)) {
	    $ssrpc->error('save', "Could not save message");
	    return false;
	  } else {
	    $auth->emailToUser($to, $config['adminEmail'], 'New CryptBro message', 
			   "Dear $user,

You have a new CryptBro message! You can check your messages at
$config[url]#inbox .

Signed,
CryptBro Admin");

	  }
	  
	} else {
	  $ssrpc->error('save', "User '$to' does not exist");
	  return false;
	}
      } else {
	$fromDir = $auth->getDirForUser($bro['from']);	
	saveBro($bro, $id, $fromDir);
      }

    }
    
    if (!saveBro($bro, $id, $saveDir)) {
      $ssrpc->error('save', "Could not save message");
      return false;
    } else {      
      $ssrpc->data('save', $id);
      $ssrpc->info('save', 'Message saved');
      return $id;
    }

  } else {
    $ssrpc->error('save', 'Cannot save empty message');
    return false;
  }
}

function getInbox() {
  global $ssrpc, $auth;

  if ($auth->isLoggedIn()) {
    $fileList = array();
    $dir = $auth->getDirForLoggedInUser();
    foreach (scandir($dir) as $file) {
      if (substr($file, -7) == '.header') {
	$id = substr($file, 0, -7);
	$header = json_decode(file_get_contents("$dir/$file"));
	$header->header->date = filemtime("$dir/$file");
	$fileList[$id] = $header->header;
      }
    }
    return $fileList;
  } else {
    return false;
  }
}

function retrieve($id) {
  global $ssrpc, $auth;

  if (!empty($id)) {

    $file = false;

    if ($auth->isLoggedIn()) {
      $dir = $auth->getDirForLoggedInUser();
      if (is_readable("$dir/$id.bro")) {
	$file = "$dir/$id.bro";
      }
    }
    
    if (!$file) {
      $dir = $auth->getUsersDir();
      if (is_readable("$dir/$id.bro")) {
	$file = "$dir/$id.bro";
      }
    }

    if ($file) {
      $bro = json_decode(file_get_contents($file))->bro;
      $bro->id = $id;
      $ssrpc->data('retrieve', $bro);
      return true;
    } else {
      $ssrpc->error('retrieve', "Message '$id' does not exist");
      return false;
    }

  }

  return false;
}

try {
  $ssrpc = new SSRPC();
  $auth = new SSAuth('files');
} catch (Exception $e) {
  $ssrpc->error('filesNotWritable', 'The directory files/ is not writable. '.
		'Please refer to the installation instructions.');
  exit();
}

if ($request = $ssrpc->getData()) {

  if($auth->isLoggedIn()) {    

    if (!empty($request->cmd)) {
      switch($request->cmd) {

      case 'hello':
	$ssrpc->data('hello', 'CryptBro server 1.0 Release Candidate 1 (2012030901)');
	$ssrpc->data('login', $auth->getLoggedInUser());
	break;
      case 'login':
	$ssrpc->data('login', $auth->getLoggedInUser());
	break;
      case 'logout':	
	$auth->logout();
	$ssrpc->data('logout', 'logout');
	$ssrpc->info('logout', 'Logged out');
	break;
      case 'register':	
	$ssrpc->error('register', 'Log out first');
	break;
      case 'save':
	save($request->data->message, $request->data->expires, $request->data->to);
	break;
      case 'retrieve':
	retrieve($request->data->id);
	break;
      case 'inbox':
	$ssrpc->data('inbox', getInbox());
	break;
/*    case 'eval':
	$result = eval("return ".$request->data->code);
	if ($result || empty($result)) {
	  $ssrpc->info('eval', $result);
	} else {
	  $ssrpc->error('eval', $result);
	}
	break; */
      default:
	$ssrpc->error('unknownCmd', 'Unknown RPC command: '.$request->cmd);
	break;
      }
    }

  } else {

    if (!empty($request->cmd)) {
      switch($request->cmd) {
	
      case 'hello':
	$ssrpc->data('hello', 'CryptBro server, v1.0 Release Candidate 1 beta (2012030901)');
	$ssrpc->data('logout', 'notLoggedIn');
	break;
      case 'login':
	login($request->data->user, $request->data->pass);
	break;
      case 'register':	
	register($request->data->user, $request->data->pass, $request->data->email);
	break;
      case 'save':
	save($request->data->message, $request->data->expires);
	break;
      case 'retrieve':
	retrieve($request->data->id);
	break;
/*    case 'eval':
	$result = eval("return ".$request->data->code);
	if ($result || empty($result)) {
	  $ssrpc->info('eval', $result);
	} else {
	  $ssrpc->error('eval', $result);
	}
	break; */
      default:
	$ssrpc->data('logout', 'notLoggedIn');
	$ssrpc->error('notLoggedIn', 'Not logged in');
	break;
      }
    }
  }  
}

?>