"""Set Android UI defaults and an explicitly approximate centered camera cutout.

Only targets the dedicated, root-capable API 35 emulator, never a physical phone.
"""
import shlex
import subprocess

SERIAL = 'emulator-5556'
AVD = 'iQOO_Z10x_5G_I2404_API35'

def adb(*args):
    return subprocess.check_output(['adb', '-s', SERIAL, *args], text=True, timeout=60).strip()

def shell(*args):
    return adb('shell', shlex.join(args))

if adb('emu', 'avd', 'name').splitlines()[0] != AVD:
    raise SystemExit('Refusing to configure a different emulator.')
if shell('getprop', 'ro.build.version.sdk') != '35':
    raise SystemExit('This profile requires Android 15 / API 35.')
print(adb('root'))
adb('wait-for-device')
if shell('id', '-u') != '0':
    raise SystemExit('A root-capable Google APIs image is required for the custom cutout.')

for namespace, name, value in [
    ('system', 'accelerometer_rotation', '0'),
    ('system', 'user_rotation', '0'),
    ('system', 'font_scale', '1.0'),
    ('system', 'peak_refresh_rate', '120.0'),
]:
    shell('settings', 'put', namespace, name, value)
shell('cmd', 'overlay', 'enable-exclusive', '--category', '--user', '0',
      'com.android.internal.systemui.navbar.gestural')

# Approximation: 48px diameter centered at (540,40), bottom=64px.
# These are testing assumptions, not measured iQOO hardware dimensions.
resources = [
    ('IqooCameraPath', 'android:string/config_mainBuiltInDisplayCutout', 'string',
     'M -24,40 A 24,24 0 1 0 24,40 A 24,24 0 1 0 -24,40 Z'),
    ('IqooCameraBounds', 'android:string/config_mainBuiltInDisplayCutoutRectApproximation', 'string',
     'M -24,0 H 24 V 64 H -24 Z'),
    ('IqooCameraFill', 'android:bool/config_fillMainBuiltInDisplayCutout', '0x12', '1'),
]
for name, resource, value_type, value in resources:
    shell('cmd', 'overlay', 'fabricate', '--target', 'android', '--name', name,
          resource, value_type, value)
    shell('cmd', 'overlay', 'enable', '--user', '0', f'com.android.shell:{name}')

print(shell('wm', 'size'))
print(shell('wm', 'density'))
print('Gesture navigation and approximate centered punch-hole enabled; font scale 1.0.')
