# -*- coding: utf-8 -*-
"""SSH 助手：用密码登录服务器，安装本机公钥实现免密，然后可执行远程命令。

用法:
  python ssh_run.py install-key   # 首次：安装公钥到 authorized_keys
  python ssh_run.py exec "命令"   # 密码方式执行远程命令
"""
import sys
import os
import paramiko

HOST = "119.29.167.133"
USER = "root"
KEY_PATH = os.path.expanduser("~/.ssh/id_ed25519.pub")


def _load_password():
    """密码不写入仓库：优先读环境变量 MALL_SSH_PASSWORD，其次读同目录 .env（已被 .gitignore 忽略）"""
    pwd = os.environ.get("MALL_SSH_PASSWORD")
    if pwd:
        return pwd
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if os.path.exists(env_path):
        with open(env_path, encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("MALL_SSH_PASSWORD="):
                    return line.split("=", 1)[1].strip()
    raise SystemExit("未找到 SSH 密码：请设置环境变量 MALL_SSH_PASSWORD 或写入 deploy/.env")


PASSWORD = _load_password()


def connect():
    cli = paramiko.SSHClient()
    cli.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    cli.connect(HOST, username=USER, password=PASSWORD, timeout=15)
    return cli


def run(cli, cmd, timeout=120):
    _, out, err = cli.exec_command(cmd, timeout=timeout)
    o = out.read().decode("utf-8", "replace")
    e = err.read().decode("utf-8", "replace")
    code = out.channel.recv_exit_status()
    return code, o, e


def main():
    action = sys.argv[1] if len(sys.argv) > 1 else "exec"
    cli = connect()
    try:
        if action == "install-key":
            with open(KEY_PATH, encoding="utf-8") as f:
                pub = f.read().strip()
            cmd = (
                "mkdir -p ~/.ssh && chmod 700 ~/.ssh && "
                f"grep -qF '{pub}' ~/.ssh/authorized_keys 2>/dev/null || "
                f"echo '{pub}' >> ~/.ssh/authorized_keys; "
                "chmod 600 ~/.ssh/authorized_keys && echo KEY-INSTALLED"
            )
            code, o, e = run(cli, cmd)
            print(o or e)
        elif action == "exec-stdin":
            cmd = sys.stdin.read()
            code, o, e = run(cli, cmd, timeout=600)
            if o:
                print(o)
            if e:
                print("[stderr]", e, file=sys.stderr)
        elif action == "put-stdin":
            # 用法: ... put-stdin <远程路径>  < 本地文件
            remote = sys.argv[2]
            data = sys.stdin.buffer.read()
            sftp = cli.open_sftp()
            with sftp.file(remote, "wb") as f:
                f.write(data)
            sftp.close()
            print(f"UPLOADED {len(data)} bytes -> {remote}")
        elif action == "put":
            # 用法: ... put <本地路径> <远程路径>
            local, remote = sys.argv[2], sys.argv[3]
            with open(local, "rb") as f:
                data = f.read()
            sftp = cli.open_sftp()
            with sftp.file(remote, "wb") as f:
                f.write(data)
            sftp.close()
            print(f"UPLOADED {len(data)} bytes -> {remote}")
        else:
            cmd = sys.argv[2]
            code, o, e = run(cli, cmd, timeout=300)
            if o:
                print(o)
            if e:
                print("[stderr]", e, file=sys.stderr)
        sys.exit(0)
    finally:
        cli.close()


if __name__ == "__main__":
    main()
