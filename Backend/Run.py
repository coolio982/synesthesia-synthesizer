import subprocess
import threading
import time
import psutil
import configparser
import os
# Ensure nothing else is using the port
PORT = 7890
def find_process_by_port(port):
    for proc in psutil.process_iter(['pid', 'name', 'connections']):
        try:
            for conn in proc.connections():
                if conn.status == 'LISTEN' and conn.laddr.port == port:
                    return proc
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return None

def terminate_process(proc):
    try:
        proc.terminate()
    except psutil.NoSuchProcess:
        pass

def run_script(script):
    subprocess.Popen(['python', script])

if __name__ == '__main__':
    # constants to monitor touches - read from config file for object
    current_directory = os.getcwd()
    # Specify the relative path to the config file
    relative_path = './config.ini'
    # Join the current directory with the relative path to get the absolute path
    config_path = os.path.join(current_directory, relative_path)
    print(config_path)
    config = configparser.ConfigParser()
    config.read(config_path)
    try:

        PORT =int(config["GENERAL"]["port"])
        print("Config File read successfully")
    except:
        print("Config File not Found")
        
    process = find_process_by_port(PORT)
    if process is not None:
        print(f"Process {process.pid} is running on port {PORT}. Terminating...")
        terminate_process(process)
    else:
        print(f"No process found running on port {PORT}.")

    script1 = 'ImageProcessingServer.py'
    script2 = 'SoundClient.py'

    # Create two threads, one for each script
    thread1 = threading.Thread(target=run_script, args=(script1,))
    thread2 = threading.Thread(target=run_script, args=(script2,))

    # Start both threads
    thread1.start()
    time.sleep(5)
    thread2.start()

    # Wait for both threads to finish
    thread1.join()
    thread2.join()