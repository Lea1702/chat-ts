#!/bin/bash

# Prompt the user to enter the path to the Pulumi project
read -p "Enter the path to your Pulumi project: " PROJECT_PATH

# Check if the entered path exists
if [ ! -d "$PROJECT_PATH" ]; then
  echo "The specified path does not exist. Exiting."
  exit 1
fi

aws configure  

# Navigate to the Pulumi project directory
cd "$PROJECT_PATH"


# Run Pulumi up to deploy the stack
pulumi up --yes