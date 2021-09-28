# Use antigen
source $HOME/antigen.zsh

# Use Oh-My-Zsh
antigen use oh-my-zsh

# Set theme
antigen theme frisk

# Set plugins (plugins not part of Oh-My-Zsh can be installed using githubusername/repo)
antigen bundle git
antigen bundle docker
antigen bundle vi-mode
antigen bundle vundle
antigen bundle tmux
antigen bundle cp
antigen bundle colored-man-pages
antigen bundle command-not-found
antigen bundle zsh-users/zsh-autosuggestions
antigen bundle zsh-users/zsh-completions
antigen bundle zsh-users/zsh-syntax-highlighting

if [[ "$OSTYPE" == "darwin"* ]]; then
    antigen bundle osx
    antigen bundle brew
fi

# Apply changes
antigen apply
