<?php 

  /*

   Stupid-Simple Authentication
   (c) 2012 Sporktronics, LLC
   http://www.sporktronics.com/

   Licensed under the Lesser GPL, version 3.0:
      http://www.gnu.org/licenses/lgpl-3.0.html

  */

class SSAuthException extends Exception { }

class SSAuth {
  
  private $usersDir;
  private $sessionVar;
  private $users = array();
  
  function __construct($usersDir) {
    session_start();
    
    $this->usersDir = realpath($usersDir);
    $this->sessionVar = 'SSAuthLoggedInUser:'.$this->usersDir;
    
    if (!is_writable($this->usersDir)) {
      throw new SSAuthException("Directory '$usersDir' is not writable");
    } else if (!$this->setupUsersDir()) {
      throw new SSAuthException("Couldn't set up users directory");
    }
    
  }

  private function setupUsersDir() {
    if (!file_exists($this->usersDir.'/users.json')) {      
      return $this->saveUsers();
    } else {
      $this->users = $this->getUsers();
      return true;
    }
  }
  
  private function saveUsers() {
    return (file_put_contents($this->usersDir.'/users.json',
			      json_encode(array("users" => $this->users))));
  }

  public function isLoggedIn() {
    return (!empty($_SESSION[$this->sessionVar]));
  }
  
  public function getLoggedInId() {
    return getUserId($_SESSION[$this->sessionVar]);
  }
  
  public function getLoggedInUserInfo() {
    return getUser($_SESSION[$this->sessionVar]);
  }
  
  public function getLoggedInUser() {
    return $_SESSION[$this->sessionVar];
  }
  
  public function getUsersDir() {
    return $this->usersDir;
  }

  public function getUsers() {
    return json_decode(file_get_contents($this->usersDir.'/users.json'))->users;
  }
  
  public function getUserId($user) {
    $userId = array_search($user, $this->users);
    
    if (is_numeric($userId)) {
      return $userId;
    } else {
      return false;
    }
  }
  
  public function getDirForUser($user) {
    $id = $this->getUserId($user);
    if (is_numeric($id)) {
      return $this->usersDir."/$id";
    } else {
      return false;
    }
  }
  
  public function getDirForLoggedInUser() {
    return $this->getDirForUser($this->getLoggedInUser());
  }

  public function getUser($user) {
    return $this->getUserById($this->getUserId($user));
  }
  
  public function getUserById($userId) {
    if (is_readable($this->usersDir."/$userId/user.json") &&
	$userjson = file_get_contents($this->usersDir."/$userId/user.json")) {

      $user = json_decode($userjson);
      return $user->user;
    } else {
      return false;
    }
  } 
  
  public function emailToUser($user, $from, $subject, $message) {
    $to = $this->getUser($user);
    if ($to) {
      return mail($to->email, $subject, $message, "From: $from");
    } else {
      return false;
    }
  }

  public function userExists($user) {
    $userId = $this->getUserId($user);
    return is_numeric($userId);
  }

  public function register($user, $pass, $email) {
    
    if (!empty($user) && !empty($pass) && !empty($email)) {
      
      if (!$this->userExists($user)) {
	array_push($this->users, $user);      

	if (!$this->saveUsers()) {
	  throw new SSAuthException('Couldn\'t save user list');
	}
	
	try {
	  $dirForUser = $this->getDirForUser($user);
	  mkdir($dirForUser);
	  file_put_contents("$dirForUser/user.json", json_encode(
								 array("user" => array(
										       "user" => $user,
										       "pass" => crypt($pass),
										       "email" => $email
										       ))));
	  return true;
	} catch (Exception $e) {
	  throw new SSAuthException('Couldn\'t save user list');
	}
      } else {
	return false;
      }
    } else {
      throw new SSAuthException('Registration requires a username, password, and email address');
    }
  }
  
  public function changeInfo($pass, $email) {
    
    if ($this->isLoggedIn()) {

      $userInfo = $this->getLoggedInUserInfo();
      
      if (!empty($pass)) {
	$userInfo->pass = crypt($pass);
      }
      
      if (!empty($email)) {
	$userInfo->email = $email;
      }
      
      if (!file_put_contents($this->getDirForUser($userInfo->user)."/user.json",
			     json_encode(array("user" => $userInfo)))) {
	throw new SSAuthException('Couldn\'t change user info');
      } else {
	return $userInfo;
      }
      
    } else {
      return false;
    }

  }

  public function login($user, $pass) {
    
    if (!empty($user) && !empty($pass)) {
      
      if ($userInfo = $this->getUser($user)) {
	if (($userInfo->user == $user) &&
	    ($userInfo->pass == crypt($pass, $userInfo->pass))) {
	  
	  $_SESSION[$this->sessionVar] = $user;
	  return true;
	}
      }
    } elseif (empty($user) && empty($pass)) {
      throw new SSAuthException('Username and password required');
      return false;
    }

    return false;    
  }
  
  public function logout() {
    unset($_SESSION[$this->sessionVar]);
    return true;
  }

}

?>