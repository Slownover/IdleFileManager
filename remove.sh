#!/bin/bash
# IDE File Manager - Blueprint remove script
echo "[IDE File Manager] Extension supprimee."

# ── Retrait de l'integration Nebula ─────────────────────────────────
python3 - <<'PYEOF'
import os

sidebar_path = "/var/www/pterodactyl/resources/views/blueprint/extensions/nebula/wrapper/sidebar/content.blade.php"
script_path = "/var/www/pterodactyl/resources/views/blueprint/extensions/nebula/wrapper/script.blade.php"

if os.path.exists(sidebar_path):
    with open(sidebar_path, "r") as f:
        content = f.read()
    
    ide_button = """
      <!-- Item: IDE File Manager -->
      <div class="tooltip-toggle" id="sidebarServerIdeWrapper">
        <span class="tooltip">IDE</span>
        <button data-tippy-content="IDE" oncontextmenu="showContextMenu(event, `/server/${fetchServerId()}/ide`)" onclick="sidebarRefresh();sidebarButtonEvent('serverIde')" id="sidebarServerIde" class="sidebarButton">
          <i class="sidebarIcon bi bi-code-slash"></i>
          @if($n_sidebar_full == "1")<span class="wideSidebarSpan" style="color: var(--sidebarPrimary)">IDE</span>@endif
        </button>
      </div>"""
    
    if ide_button in content:
        content = content.replace(ide_button, "")
        with open(sidebar_path, "w") as f:
            f.write(content)
        print("[IDE File Manager] Bouton IDE retire de la barre laterale de Nebula.")

if os.path.exists(script_path):
    with open(script_path, "r") as f:
        js = f.read()
        
    click_inject = "\\n    if(btn === \\"serverIde\\") { document.querySelector(\\"a:not([blueprint])[href='/server/\\"+serverId+\\"/ide']\\").click() };"
    active_inject = "\\n    if(document.getElementById('sidebarServerIde')) { if(currentPage === \\"serverIde\\") { document.getElementById('sidebarServerIde').className = 'sidebarButton sidebarButtonSelected'; } else { document.getElementById('sidebarServerIde').className = 'sidebarButton'; } }"
    
    display_inject = """
    if(document.getElementById('sidebarServerIde')) {
      if(document.querySelector("a:not([blueprint])[href='/server/"+serverId+"/ide']") === null) {
        document.getElementById('sidebarServerIde').style.display = "none";
      } else {
        document.getElementById('sidebarServerIde').style.display = "inline";
        nopage=false
      }
    }"""
    
    modified = False
    if click_inject in js:
        js = js.replace(click_inject, "")
        modified = True
    if active_inject in js:
        js = js.replace(active_inject, "")
        modified = True
    if display_inject in js:
        js = js.replace(display_inject, "")
        modified = True
        
    if modified:
        with open(script_path, "w") as f:
            f.write(js)
        print("[IDE File Manager] Evenements JS de l'IDE retires de Nebula.")
PYEOF
