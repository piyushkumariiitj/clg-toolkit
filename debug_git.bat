@echo off
git status > git_status.txt 2>&1
git log -n 1 > git_log.txt 2>&1
exit
