<?php

function primeos_enqueue_styles() {
    wp_enqueue_style('primeos-style', get_stylesheet_uri());
}

add_action('wp_enqueue_scripts', 'primeos_enqueue_styles');