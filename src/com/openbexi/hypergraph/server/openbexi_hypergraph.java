package com.openbexi.hypergraph.server;

import com.openbexi.hypergraph.data_browser.data_configuration;
import com.openbexi.hypergraph.servlets.ob_sse_hypergraph;
import org.apache.catalina.Context;
import org.apache.catalina.LifecycleException;
import org.apache.catalina.Service;
import org.apache.catalina.connector.Connector;
import org.apache.catalina.startup.Tomcat;
import org.apache.coyote.http2.Http2Protocol;

import java.io.File;
import java.io.IOException;
import java.nio.file.FileSystems;
import java.util.logging.FileHandler;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.logging.SimpleFormatter;

/**
 * Embedded Apache Tomcat- http/2 for OpenBEXI hypergraph
 *
 * @version 1.0.0
 */

enum ob_mode {
    no_secure, secure, secure_sse, no_secure_ws, secure_ws
}

public class openbexi_hypergraph implements Runnable {

    private final ob_mode _ob_mode;
    private final Logger _logger = Logger.getLogger("");
    private final String _data_conf;
    private final String _data_path;
    private final String _filter_include;
    private final String _filter_exclude;
    private final String _port;

    openbexi_hypergraph(ob_mode mode, String data_conf, String data_path, String filter_include, String filter_exclude, String port) {
        _ob_mode = mode;
        _data_conf = data_conf;
        _data_path = data_path;
        _filter_include = filter_include;
        _filter_exclude = filter_exclude;
        _port = port;
    }

    /**
     * Main method.
     *
     * @param args command line arguments passed to the application. Currently
     *             unused.
     */
    public static void main(String[] args) {
        String connector = "";
        String[] connectors = new String[0];
        String data_conf = "";
        String data_model = "";
        String filter_include = "";
        String filter_exclude = "";

        if (args.length != 2) {
            System.err.println("openBEXI hypergraph not started because of bad usage:");
            System.err.println("Argument " + args[0] + " " + "-conf <file> ");
            System.exit(1);
        }
        if (args[0].equals("-data_conf")) {
            data_conf = args[1];
            try {
                File file_configuration = new File(data_conf);
                if (!file_configuration.exists()) {
                    System.err.println("openBEXI hypergraph not started because the configuration file does not exist:");
                    System.err.println("Argument " + args[0] + " " + "-conf <file does not exist> ");
                    System.exit(1);
                }
                data_configuration configuration = new data_configuration(data_conf);
                connectors = configuration.getConnector(0).split("\\|");
            } catch (IOException e) {
                throw new RuntimeException(e);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
        System.out.println("Argument : " + args[0]+" "+args[1]);

        for (int i = 0; i < connectors.length; i++) {
            String port = connectors[i].split(":")[1];
            if (connectors[i].split(":")[0].equals("secure_sse")) {
                openbexi_hypergraph webServer_hypergraph_sse = new openbexi_hypergraph(ob_mode.secure_sse, data_conf, data_model, filter_include, filter_exclude, port);
                webServer_hypergraph_sse.run();
            }
        }
    }

    /**
     * Run tomcat server.
     *
     * @see Thread#run()
     */
    @Override
    public void run() {
        try {
            start(this._ob_mode);
        } catch (LifecycleException e) {
            _logger.severe(e.getMessage());
        }

    }

    private void start(ob_mode mode) throws LifecycleException {
        // Set log
        FileHandler fileHandler = null;
        try {
            fileHandler = new FileHandler("tomcat/catalina.out", true);
            fileHandler.setFormatter(new SimpleFormatter());
            fileHandler.setLevel(Level.FINEST);
            fileHandler.setEncoding("UTF-8");

        } catch (IOException e) {
            _logger.severe(e.getMessage());
        }
        _logger.addHandler(fileHandler);

        Tomcat tomcat = new Tomcat();
        Service service = tomcat.getService();

        Connector httpsConnector = new Connector();
        //  Connector httpsConnector = new Connector(Http11Nio2Protocol.class.getName());
        httpsConnector.setSecure(true);
        httpsConnector.setScheme("https");
        httpsConnector.setProperty("keyAlias", "test_rsa_private_key_entry");
        httpsConnector.setProperty("keystorePass", "keystores");
        httpsConnector.setProperty("keystoreFile", FileSystems.getDefault().getPath("tomcat", "resources", "keystore2.jks").toFile().getAbsolutePath());
        httpsConnector.setProperty("clientAuth", "false");
        httpsConnector.setProperty("sslProtocol", "TLS");
        httpsConnector.setProperty("SSLEnabled", "true");

        Context ob_hypergraph_context = null;

        if (mode == ob_mode.secure_sse) {
            // Set Http2 connector
            httpsConnector.addUpgradeProtocol(new Http2Protocol());
            httpsConnector.setPort(Integer.parseInt(_port));
            tomcat.setPort(Integer.parseInt(_port));

            // Enable response compression
            httpsConnector.setProperty("compression", "on");
            // Defaults are text/html,text/xml,text/plain,text/css
            httpsConnector.setProperty("compressableMimeType", "text/html,text/xml,text/plain,text/css,text/csv,application/json_files_manager");

            service.addConnector(httpsConnector);
            tomcat.setConnector(httpsConnector);

            ob_hypergraph_context = tomcat.addContext("/", new File(".").getAbsolutePath());

            Tomcat.addServlet(ob_hypergraph_context, "ob_sse", new ob_sse_hypergraph());
            ob_hypergraph_context.addServletMappingDecoded("/openbexi_hypergraph_sse/vertices", "ob_sse");

        }
        if (_data_conf != null && ob_hypergraph_context != null)
            ob_hypergraph_context.addParameter("data_conf", _data_conf);

        tomcat.start();

    }
}