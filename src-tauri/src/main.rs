#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Child};
use std::thread;
use std::time::Duration;
use std::env;

fn start_next_server() -> Child {
  // Get the directory where the app is installed
  let app_dir = env::current_exe()
    .ok()
    .and_then(|p| p.parent().map(|p| p.to_path_buf()))
    .unwrap_or_else(|| env::current_dir().unwrap());

  // Try to find node executable
  let node_cmd = if cfg!(target_os = "windows") {
    "node.exe"
  } else {
    "node"
  };

  #[cfg(target_os = "windows")]
  {
    // On Windows, try to run npm directly
    Command::new("cmd")
      .args(&["/C", "npm run start"])
      .current_dir(&app_dir)
      .spawn()
      .or_else(|_| {
        // Fallback: try to find node in common locations
        Command::new("powershell")
          .args(&["-Command", "npm run start"])
          .current_dir(&app_dir)
          .spawn()
      })
      .expect("Failed to start Next.js server")
  }
  
  #[cfg(not(target_os = "windows"))]
  {
    Command::new("npm")
      .arg("run")
      .arg("start")
      .current_dir(&app_dir)
      .spawn()
      .expect("Failed to start Next.js server")
  }
}

fn main() {
  // Start the Next.js server in the background
  let mut _server = start_next_server();
  
  // Give the server more time to start (up to 10 seconds)
  thread::sleep(Duration::from_secs(10));
  
  tauri::Builder::default()
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
