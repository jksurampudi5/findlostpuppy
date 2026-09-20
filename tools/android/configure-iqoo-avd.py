"""Apply exact display geometry to the newly created iQOO AVD (while stopped)."""
from pathlib import Path

config = Path.home() / '.android/avd/iQOO_Z10x_5G_I2404_API35.avd/config.ini'
if not config.exists():
    raise SystemExit('Create iQOO_Z10x_5G_I2404_API35 with avdmanager first.')
values = dict(line.split('=', 1) for line in config.read_text().splitlines() if '=' in line)
if values.get('hw.device.name') != 'iqoo_z10x_5g_i2404':
    raise SystemExit('Refusing to modify an AVD with a different hardware profile.')
values.update({
    'avd.ini.displayname': 'iQOO Z10x 5G I2404',
    'hw.lcd.width': '1080',
    'hw.lcd.height': '2408',
    'hw.lcd.density': '393',
    'hw.lcd.vsync': '120',
    'hw.initialOrientation': 'portrait',
    'hw.keyboard': 'no',
    'hw.mainKeys': 'no',
    'hw.dPad': 'no',
    'hw.trackBall': 'no',
    'hw.ramSize': '2048',
    'hw.cpu.ncore': '4',
    'hw.gpu.enabled': 'yes',
    'hw.gpu.mode': 'auto',
    'disk.dataPartition.size': '4G',
    'skin.name': '1080x2408',
    'skin.path': '1080x2408',
    'showDeviceFrame': 'no',
})
config.write_text(''.join(f'{key}={value}\n' for key, value in sorted(values.items())))
print(f'Configured {config}: 1080x2408, 393 DPI, portrait, 120 Hz guest VSYNC')
