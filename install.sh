#!/bin/bash
# IDE File Manager - Blueprint install script
echo "[IDE File Manager] Installation des fichiers terminee."

# ── Integration dynamique avec Nebula ───────────────────────────────
python3 - <<'PYEOF'
import os

sidebar_path = "/var/www/pterodactyl/resources/views/blueprint/extensions/nebula/wrapper/sidebar/content.blade.php"
script_path = "/var/www/pterodactyl/resources/views/blueprint/extensions/nebula/wrapper/script.blade.php"

if os.path.exists(sidebar_path):
    print("[IDE File Manager] Nebula sidebar detectee, application du patch...")
    with open(sidebar_path, "r") as f:
        content = f.read()
    
    if "sidebarServerIde" not in content:
        target = 'id="sidebarServerFilemanager" class="sidebarButton">\n          @if($n_sidebar_server_files == "" || $n_sidebar_full == "1")\n          <i class="sidebarIcon {{ $__server_files }}"></i>\n          @else\n          <img class="customicon" src="{{ $n_sidebar_server_files }}"></img>\n          @endif\n          @if($n_sidebar_full == "1")<span class="wideSidebarSpan" style="color: var(--sidebarPrimary)">Files</span>@endif\n        </button>\n      </div>'
        
        ide_button = """
      <!-- Item: IDE File Manager -->
      <div class="tooltip-toggle" id="sidebarServerIdeWrapper">
        <span class="tooltip">IDE</span>
        <button data-tippy-content="IDE" oncontextmenu="showContextMenu(event, `/server/${fetchServerId()}/ide`)" onclick="sidebarRefresh();sidebarButtonEvent('serverIde')" id="sidebarServerIde" class="sidebarButton">
          <i class="sidebarIcon bi bi-code-slash"></i>
          @if($n_sidebar_full == "1")<span class="wideSidebarSpan" style="color: var(--sidebarPrimary)">IDE</span>@endif
        </button>
      </div>"""
        
        if target in content:
            content = content.replace(target, target + ide_button)
            with open(sidebar_path, "w") as f:
                f.write(content)
            print("[IDE File Manager] Bouton IDE ajoute a la barre laterale de Nebula.")
        else:
            content = content.replace("<!-- Item: Databases -->", ide_button + "\\n    <!-- Item: Databases -->")
            with open(sidebar_path, "w") as f:
                f.write(content)
            print("[IDE File Manager] Bouton IDE insere par fallback avant Databases.")

if os.path.exists(script_path):
    print("[IDE File Manager] Nebula script detecte, application du patch...")
    with open(script_path, "r") as f:
        js = f.read()
        
    if "serverIde" not in js:
        click_target = "if(btn === \\"serverFiles\\") { document.querySelector(\\"a:not([blueprint])[href='/server/\\"+serverId+\\"/files']\\").click() };"
        click_inject = "\\n    if(btn === \\"serverIde\\") { document.querySelector(\\"a:not([blueprint])[href='/server/\\"+serverId+\\"/ide']\\").click() };"
        js = js.replace(click_target, click_target + click_inject)
        
        active_target = "if(currentPage === \\"serverFiles\\") {document.getElementById('sidebarServerFilemanager').className = 'sidebarButton sidebarButtonSelected';fileModeShow() }"
        active_inject = "\\n    if(document.getElementById('sidebarServerIde')) { if(currentPage === \\"serverIde\\") { document.getElementById('sidebarServerIde').className = 'sidebarButton sidebarButtonSelected'; } else { document.getElementById('sidebarServerIde').className = 'sidebarButton'; } }"
        js = js.replace(active_target, active_target + active_inject)
        
        display_target = """    if(document.querySelector("a:not([blueprint])[href='/server/"+serverId+"/files']") === null) {
      document.getElementById('sidebarServerFilemanager').style.display = "none";
    } else {
      document.getElementById('sidebarServerFilemanager').style.display = "inline";
      nopage=false
    }"""
        
        display_inject = """
    if(document.getElementById('sidebarServerIde')) {
      if(document.querySelector("a:not([blueprint])[href='/server/"+serverId+"/ide']") === null) {
        document.getElementById('sidebarServerIde').style.display = "none";
      } else {
        document.getElementById('sidebarServerIde').style.display = "inline";
        nopage=false
      }
    }"""
        js = js.replace(display_target, display_target + display_inject)
        
        with open(script_path, "w") as f:
            f.write(js)
        print("[IDE File Manager] Evenements JS de l'IDE injectes dans Nebula.")
PYEOF
