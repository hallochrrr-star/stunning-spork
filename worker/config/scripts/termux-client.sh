#!/usr/bin/env python3
import requests
import base64
import json
import time

class DNSRealTunnel:
    def __init__(self):
        self.config = self.load_config()
        self.base_url = self.config['worker_url']
        self.session = requests.Session()
        self.tunnel_id = None
        
    def load_config(self):
        try:
            with open('../config/dns-config.json', 'r') as f:
                return json.load(f)
        except:
            return {
                "worker_url": "https://dns-tunnel.etecsa.tk",
                "domain": "etecsa.tk"
            }
    
    def test_dns_server(self):
        print("🔍 Probando servidor DNS real...")
        try:
            response = self.session.get(
                f"{self.base_url}/status",
                timeout=15
            )
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Servidor DNS operativo: {data['message']}")
                print(f"📍 Dominio: {data.get('server', 'N/A')}")
                return True
        except Exception as e:
            print(f"❌ Error servidor DNS: {e}")
        return False
    
    def dns_query_legitimate(self, domain="whatsapp.com", qtype="TXT"):
        print(f"🔍 Consulta DNS legítima: {domain} ({qtype})")
        try:
            response = self.session.get(
                f"{self.base_url}/dns-query?name={domain}&type={qtype}",
                headers={'Accept': 'application/dns-json'},
                timeout=15
            )
            data = response.json()
            print(f"✅ Respuesta DNS recibida")
            print(f"   Status: {data.get('Status')}")
            print(f"   Respuestas: {len(data.get('Answer', []))}")
            return data
        except Exception as e:
            print(f"❌ Error consulta DNS: {e}")
            return None
    
    def connect_dns_tunnel(self):
        print("🚀 Conectando tunnel DNS...")
        try:
            response = self.session.get(
                f"{self.base_url}/dns-tunnel?action=connect",
                timeout=20
            )
            data = response.json()
            
            if data.get('status') == 'tunnel_established':
                self.tunnel_id = data['tunnel_id']
                print(f"✅ Tunnel DNS establecido: {self.tunnel_id}")
                print(f"🔧 Protocolo: {data['protocol']}")
                print(f"📦 Chunk size: {data['max_chunk_size']} bytes")
                return True
        except Exception as e:
            print(f"❌ Error conectando tunnel: {e}")
        return False
    
    def send_data_via_dns(self, data="Test data for DNS tunnel"):
        print("📤 Enviando datos via DNS tunneling...")
        try:
            encoded = base64.b64encode(data.encode()).decode()
            
            response = self.session.get(
                f"{self.base_url}/dns-query?name=tunnel.etecsa.tk&type=TXT&data={encoded}",
                headers={'Accept': 'application/dns-json'},
                timeout=15
            )
            
            dns_data = response.json()
            print(f"✅ Datos enviados via DNS")
            print(f"   Bytes: {len(encoded)}")
            if dns_data.get('Answer'):
                print(f"   Respuesta: {dns_data['Answer'][0].get('data', 'OK')}")
            return True
        except Exception as e:
            print(f"❌ Error enviando datos: {e}")
            return False
    
    def get_socks_config(self):
        print("🧦 Obteniendo configuración SOCKS sobre DNS...")
        try:
            response = self.session.get(f"{self.base_url}/socks", timeout=15)
            data = response.json()
            
            print(f"✅ SOCKS {data['version']} listo")
            print(f"   Puerto local: {data['local_port']}")
            print("   Instrucciones:")
            for step in data.get('setup_instructions', []):
                print(f"     {step}")
            return data
        except Exception as e:
            print(f"❌ Error SOCKS: {e}")
            return None
    
    def full_tunnel_test(self):
        print("🌐 PRUEBA COMPLETA DNS TUNNELING")
        print("=" * 50)
        
        steps = [
            ("Servidor DNS", self.test_dns_server),
            ("Consulta DNS", lambda: self.dns_query_legitimate()),
            ("Tunnel DNS", self.connect_dns_tunnel),
            ("Datos via DNS", self.send_data_via_dns),
            ("SOCKS Config", self.get_socks_config)
        ]
        
        for step_name, step_func in steps:
            print(f"\n🎯 {step_name}...")
            if not step_func():
                print(f"❌ Falló en: {step_name}")
                return False
            time.sleep(1)
        
        print("\n🎉 ¡DNS TUNNELING OPERATIVO!")
        return True

def main():
    client = DNSRealTunnel()
    
    print("🌐 DNS REAL TUNNEL CLIENT - etecsa.tk")
    print("🔧 Emulación DNS legítima para evasión")
    print("=" * 60)
    
    if client.full_tunnel_test():
        print("\n🚀 PLAN ORIGINAL ACTIVADO:")
        print("   • Servidor DNS real ✓")
        print("   • Tunnel establecido ✓")
        print("   • SOCKS sobre DNS ✓")
        print("   • Próximo: SSH sobre DNS")
    else:
        print("\n⚠️  Verificar configuración:")
        print("   • Dominio etecsa.tk en Cloudflare")
        print("   • Worker configurado correctamente")
        print("   • Propagación DNS completa")

if __name__ == "__main__":
    main()
