#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Child};
use std::thread;
use std::time::Duration;

fn start_next_server() -> Child {
  #[cfg(target_os = "windows")]
  {
    Command::new("cmd")
      .args(&["/C", "npm run start"])
      .spawn()
      .expect("Failed to start Next.js server")
  }
  
  #[cfg(not(target_os = "windows"))]
  {
    Command::new("npm")
      .arg("run")
      .arg("start")
      .spawn()
      .expect("Failed to start Next.js server")
  }
}

fn main() {
  // Start the Next.js server in the background
  let mut _server = start_next_server();
  
  // Give the server time to start
  thread::sleep(Duration::from_secs(3));
  
  tauri::Builder::default()
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
