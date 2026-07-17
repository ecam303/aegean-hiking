import base64
from pathlib import Path

resources = [
    (
        Path(r'C:/Users/ellen/AppData/Roaming/Code/User/workspaceStorage/bd383f66e25db2328b67bd3b3f71421d/GitHub.copilot-chat/chat-session-resources/4b2c130f-8331-42ac-a123-765e8a3d5a53/call_2xAQYloby54Un7wFvuUOGoSG__vscode-1784296435805/content.txt'),
        Path('mockup_frontpage.png'),
    ),
    (
        Path(r'C:/Users/ellen/AppData/Roaming/Code/User/workspaceStorage/bd383f66e25db2328b67bd3b3f71421d/GitHub.copilot-chat/chat-session-resources/4b2c130f-8331-42ac-a123-765e8a3d5a53/call_Jcyo1CiQeoGvoVyecLyXwB0v__vscode-1784296435807/content.txt'),
        Path('mockup_skarkos.png'),
    ),
]

for src, out in resources:
    data = src.read_text().replace('\n', '').strip()
    data += '=' * (-len(data) % 4)
    out.write_bytes(base64.b64decode(data))
    print('wrote', out)
