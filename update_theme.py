import sys

def update_theme():
    file_path = "style.css"
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    replacements = [
        ("--bg-dark: #0f172a;", "--bg-dark: #f8fafc; /* Light Mode Background */"),
        ("--bg-darker: #020617;", "--bg-darker: #ffffff; /* Lighter background */"),
        ("--text-light: #f8fafc;", "--text-light: #0f172a; /* Dark text for light mode */"),
        ("--text-muted: #94a3b8;", "--text-muted: #64748b; /* Muted dark text */"),
        ("--glass-bg: rgba(30, 41, 59, 0.4);", "--glass-bg: rgba(255, 255, 255, 0.8);"),
        ("--glass-border: rgba(255, 255, 255, 0.1);", "--glass-border: rgba(0, 0, 0, 0.1);"),
        ("--glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);", "--glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);"),
        ("color: white;", "color: var(--text-light);"),
        ("background: rgba(0,0,0,0.2);", "background: rgba(255, 255, 255, 0.9);"),
        ("border: 1px solid rgba(255,255,255,0.1);", "border: 1px solid rgba(0,0,0,0.1);"),
        ("border: 1px dashed rgba(255,255,255,0.05);", "border: 1px dashed rgba(0,0,0,0.1);"),
        ("border-top: 1px solid rgba(255,255,255,0.05);", "border-top: 1px solid rgba(0,0,0,0.1);"),
        ("border-bottom: 1px solid rgba(255,255,255,0.1);", "border-bottom: 1px solid rgba(0,0,0,0.1);"),
        ("border-bottom: 1px solid rgba(255,255,255,0.05);", "border-bottom: 1px solid rgba(0,0,0,0.05);"),
        ("border: 1px solid rgba(255,255,255,0.05);", "border: 1px solid rgba(0,0,0,0.05);"),
        ("background: rgba(255,255,255,0.03);", "background: rgba(0,0,0,0.03);"),
        ("background: rgba(255,255,255,0.05);", "background: rgba(0,0,0,0.05);"),
        ("background: rgba(255,255,255,0.08);", "background: rgba(0,0,0,0.08);"),
        ("background: rgba(255, 255, 255, 0.1);", "background: rgba(0, 0, 0, 0.05);"),
        ("background: rgba(255,255,255,0.1);", "background: rgba(0,0,0,0.05);"),
        ("background: rgba(255,255,255,0.2);", "background: rgba(0,0,0,0.1);"),
        ("rgba(255,255,255,0.5)", "rgba(0,0,0,0.2)"),
        ("rgba(255,255,255,0.8)", "rgba(0,0,0,0.4)"),
        ("box-shadow: inset 0 0 20px rgba(255,255,255,0.5);", "box-shadow: inset 0 0 20px rgba(0,0,0,0.1);"),
        ("box-shadow: inset 0 0 40px rgba(255,255,255,0.8);", "box-shadow: inset 0 0 40px rgba(0,0,0,0.2);")
    ]

    for old, new in replacements:
        content = content.replace(old, new)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Theme updated successfully!")

if __name__ == '__main__':
    update_theme()
