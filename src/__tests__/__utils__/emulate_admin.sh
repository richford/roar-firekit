PREVIOUS_DIR=$(pwd)
cd firebase/admin
firebase use --clear
firebase use admin
firebase emulators:start --project demo-gse-roar-admin --import admin_export &
cd $PREVIOUS_DIR
