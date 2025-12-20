#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::process::{Command, Child, Stdio};
use std::thread;
use std::time::Duration;
use std::env;

fn start_next_server() -> Result<Child, String> {
  // Get the directory where the app is installed
  let app_dir = env::current_exe()
    .ok()
    .and_then(|p| p.parent().map(|p| p.to_path_buf()))
    .unwrap_or_else(|| env::current_dir().unwrap());

  eprintln!("[TAURI] App directory: {:?}", app_dir);
  eprintln!("[TAURI] Checking for package.json...");
  
  let package_json = app_dir.join("package.json");
  if package_json.exists() {
    eprintln!("[TAURI] package.json found!");
  } else {
    eprintln!("[TAURI] ERROR: package.json NOT found!");
    return Err(format!("package.json not found in {:?}", app_dir));
  }

  eprintln!("[TAURI] Attempting to start Next.js server...");

  #[cfg(target_os = "windows")]
  {
    // On Windows, try to run npm directly
    let result = Command::new("cmd")
      .args(&["/C", "npm run start"])
      .current_dir(&app_dir)
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .spawn();
    
    match result {
      Ok(child) => {
        eprintln!("[TAURI] Server process started successfully!");
        Ok(child)
      }
      Err(e) => {
        eprintln!("[TAURI] ERROR starting server: {}", e);
        Err(format!("Failed to start server: {}", e))
      }
    }
  }
  
  #[cfg(not(target_os = "windows"))]
  {
    match Command::new("npm")
      .arg("run")
      .arg("start")
      .current_dir(&app_dir)
      .stdout(Stdio::piped())
      .stderr(Stdio::piped())
      .spawn() {
      Ok(child) => {
        eprintln!("[TAURI] Server process started successfully!");
        Ok(child)
      }
      Err(e) => {
        eprintln!("[TAURI] ERROR starting server: {}", e);
        Err(format!("Failed to start server: {}", e))
      }
    }
  }
}

fn main() {
  eprintln!("[TAURI] Starting SEMS Tauri app...");
  
  // Start the Next.js server in the background
  match start_next_server() {
    Ok(mut _server) => {
      eprintln!("[TAURI] Waiting 10 seconds for server to initialize...");
      thread::sleep(Duration::from_secs(10));
      eprintln!("[TAURI] Opening Tauri window...");
    }
    Err(e) => {
      eprintln!("[TAURI] WARNING: Failed to start server: {}", e);
      eprintln!("[TAURI] Continuing anyway, server might start later...");
      thread::sleep(Duration::from_secs(5));
    }
  }
  
  tauri::Builder::default()
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
