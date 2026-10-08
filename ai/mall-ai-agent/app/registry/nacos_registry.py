"""Nacos 服务注册：启动注册（SDK 自动维持心跳），关闭注销"""
import socket

from nacos import NacosClient

from app.config import settings


def local_ip() -> str:
    """取本机出口 IP（对齐 Java 服务 preferred-networks，优先 192.168.1 网段）"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
    finally:
        s.close()
    if not ip.startswith("192.168.1"):
        # 多网卡时尝试找 192.168.1 网段地址
        try:
            for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
                addr = info[4][0]
                if addr.startswith("192.168.1"):
                    return addr
        except OSError:
            pass
    return ip


class NacosRegistry:
    """封装 Nacos 实例注册/注销"""

    def __init__(self):
        # Nacos 默认命名空间(public)的 ID 是空串，传 "public" 会注册到不存在的命名空间
        namespace = settings.nacos_namespace.strip()
        if namespace.lower() == "public":
            namespace = ""
        self.client = NacosClient(settings.nacos_server, namespace=namespace)
        self.ip = local_ip()
        self.port = settings.app_port

    def _add_instance(self):
        # heartbeat_interval 必须显式传：SDK 默认 None 时不启动心跳线程，
        # 临时实例(ephemeral)无心跳会被 Nacos 在约 30 秒后剔除（服务"自动消失"的根因）
        self.client.add_naming_instance(
            settings.app_name,
            self.ip,
            self.port,
            group_name=settings.nacos_group,
            ephemeral=True,
            healthy=True,
            heartbeat_interval=5,
        )

    def register(self):
        """注册到 Nacos，失败自动重试；最终失败仅告警不阻断服务启动"""
        import time

        last_err = None
        for attempt in range(1, 4):  # 最多重试 3 次
            try:
                self._add_instance()
                print(f"[nacos] 已注册 {settings.app_name} -> {self.ip}:{self.port}")
                return
            except Exception as e:
                last_err = e
                print(f"[nacos] 注册失败（第 {attempt}/3 次）：{e}")
                time.sleep(2)
        print(f"[nacos] 注册最终失败，服务将不注册继续启动：{last_err}")

    def deregister(self):
        try:
            self.client.remove_naming_instance(
                settings.app_name,
                self.ip,
                self.port,
                group_name=settings.nacos_group,
                ephemeral=True,
            )
            print(f"[nacos] 已注销 {settings.app_name}")
        except Exception as e:  # 注销失败不影响进程退出
            print(f"[nacos] 注销失败（忽略）：{e}")


registry = NacosRegistry()
