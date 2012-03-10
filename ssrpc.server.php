<?php 

  /*

   Stupid-Simple RPC
   (c) 2012 Sporktronics, LLC

   Licensed under the Lesser GPL, version 3.0:
      http://www.gnu.org/licenses/lgpl-3.0.html

  */

class SSRPC {  

  private $rawData;
  private $sendData = array();
  private $receiveData = array();
  private $error = array();
  private $info = array();
  private $warn = array();
  
  function __construct() {

    // We're going to hijack all the output so we can send it later
    // without breaking our protocol.
    ob_start();

    try {
      header('Content-type: application/json');
    } catch (Exception $e) { /* Oh well, someone's already sent a
			      header */ }

    $this->receive();
  }
  
  // Ding, program's done! Let's send everything we've got.
  function __destruct() {

    // Drop any output we've hijacked into a data container.
    if ($ob = ob_get_contents()) {
      $this->data('outputBuffer', $ob);
    }
    
    ob_end_clean();
    $this->send();
    exit();
  }
  
  // Gather up the data sent from the client and put it where it needs
  // to go.
  private function receive() {
    
    // We'll keep the raw request data in case we need it.
    $this->rawData = file_get_contents('php://input');

    if (!empty($this->rawData)) {      
      if ($json = json_decode($this->rawData)) {	
	$this->receiveData = $json->ssrpc;
      } else {
	// We only speak SSRPC here, bub.
	$this->error('badProtocol', 'SSRPC expected');
	exit();
      }
    } else {
      // We only speak SSRPC here, bub.
      $this->error('badProtocol', 'SSRPC expected');
      exit();
    }
    
    if (empty($this->receiveData)) {
      $this->warn('emptyRequest', 'The request was empty');
    }
    
    return $this->getData();
  }
  
  // Combine everything into an specially-formed object, send it, then
  // exit.
  private function send() {
    $response = array();
    
    if (!empty($this->sendData)) {
      $response["data"] = $this->sendData;
    }
    
    if (!empty($this->error)) {
      $response["error"] = $this->error;
    }
    
    if (!empty($this->info)) {
      $response["info"] = $this->info;
    }
    
    if (!empty($this->warn)) {
      $response["warn"] = $this->warn;
    }
    
    if (!empty($response)) {
      $responseStr = json_encode(array('ssrpc' => $response));
      header('Content-Length: '.strlen($responseStr));
      echo $responseStr;
    }
    
    exit();
  }
  
  public function getData() {
    return $this->receiveData;
  }
  
  public function getRawData() {
    return $this->rawData;
  }
  
  public function getJson() {
    return json_encode($this->getData());
  }
  
  // We've got a few different kinds of containers for sorting stuff
  // in: data, info, errors, and warnings. The client listens for
  // these and does stuff when it sees them.

  public function data($name, $data) {
    $this->sendData[$name] = $data; 
  }
  
  public function error($name, $message) {
    $this->error[$name] = $message;
  }
  
  public function info($name, $message) {
    $this->info[$name] = $message;
  }
  
  public function warn($name, $message) {
    $this->warn[$name] = $message;
  }
  
}

?>