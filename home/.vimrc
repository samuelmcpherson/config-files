" Setting up Vundle - the vim plugin bundler
    let iCanHazVundle=1
    let vundle_readme=expand('~/.vim/bundle/vundle/README.md')
    if !filereadable(vundle_readme)
        echo "Installing Vundle.."
        echo ""
        silent !mkdir -p ~/.vim/bundle
        silent !git clone https://github.com/VundleVim/Vundle.vim ~/.vim/bundle/vundle
        let iCanHazVundle=0
    endif

    set nocompatible              " be iMproved, required
    filetype off                  " required
    set rtp+=~/.vim/bundle/vundle/

    call vundle#begin()
    Plugin 'VundleVim/Vundle.vim'

    "Add your bundles here
    Plugin 'https://github.com/tpope/vim-fugitive'
    Plugin 'scrooloose/nerdtree'
    Plugin 'bling/vim-airline'
    Plugin 'airblade/vim-gitgutter'
    Plugin 'yggdroot/indentline'


    if iCanHazVundle == 0
        echo "Installing Vundles, please ignore key map error messages"
        echo ""
        :PluginInstall
    endif

    call vundle#end()

    "must be last
    filetype plugin indent on " load filetype plugins/indent settings
    syntax on                      " enable syntax
 
" Setting up Vundle - the vim plugin bundler end
