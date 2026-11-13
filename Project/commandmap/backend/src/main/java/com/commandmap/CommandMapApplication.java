package com.commandmap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * CommandMap backend. Stateless: it validates and serialises scenario data and never stores it.
 */
@SpringBootApplication
public class CommandMapApplication {
    public static void main(String[] args) {
        SpringApplication.run(CommandMapApplication.class, args);
    }
}
