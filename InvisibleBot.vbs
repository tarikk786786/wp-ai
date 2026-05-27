Set WshShell = CreateObject("WScript.Shell")
' Run the node server directly with tsx, completely hidden (0)
WshShell.Run "cmd /c ""cd /d """"C:\Users\tarik\Downloads\tarik AI"""" && npm run server > logs\bot-hidden.log 2>&1""", 0, False
