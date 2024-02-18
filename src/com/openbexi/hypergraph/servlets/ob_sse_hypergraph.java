package com.openbexi.hypergraph.servlets;

import com.openbexi.hypergraph.data_browser.*;
import org.json.simple.JSONArray;
import org.json.simple.parser.ParseException;

import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.annotation.WebListener;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.logging.Logger;

@WebServlet(asyncSupported = true)
@WebListener
public class ob_sse_hypergraph extends HttpServlet implements HttpSessionListener {

    int id = 0;
    private data_configuration _data_configuration;

    public ob_sse_hypergraph() {
        super();
    }

    @Override
    public void init() throws ServletException {
        super.init();
        String data_conf = getServletContext().getInitParameter("data_conf");
        try {
            _data_configuration = new data_configuration(data_conf);
        } catch (IOException e) {
            throw new RuntimeException(e);
        } catch (ParseException e) {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void doGet(HttpServletRequest req, HttpServletResponse resp) {
        HttpSession session = req.getSession();
        resp.setCharacterEncoding("UTF-8");

        // Read parameters
        String ob_request = req.getParameter("ob_request");
        String data_path = _data_configuration.getDataPath(0);
        String ob_hypergraph_name = req.getParameter("hypergraphName");
        Logger logger = Logger.getLogger("");
        logger.info("GET - SSE - Creating hypergraph");

        if (resp != null) {
            try {

                PrintWriter respWriter = resp.getWriter();
                //Important to put a "," not ";" between stream and charset
                resp.setContentType("text/event-stream");
                resp.setCharacterEncoding("UTF-8");
                //Important, otherwise only  test URL  like https://localhost:8443/openbexi_hypergraph.html works
                resp.addHeader("Access-Control-Allow-Origin", "*");
                // If clients have set Access-Control-Allow-Credentials to true, the server will not permit the use of
                // credentials and access to resource by the client will be blocked by CORS policy.
                resp.addHeader("Access-Control-Allow-Credentials", "true");
                resp.addHeader("Cache-Control", "no-cache");
                resp.addHeader("Connection", "keep-alive");
                //respWriter.write("data:" + json + "\n\n");
                respWriter.write("retry: 1000000000\n\n");
                respWriter.flush();
                boolean error = respWriter.checkError();
                if (error == true) {
                    logger.info("Client disconnected");
                }
            } catch (IOException e) {
                logger.severe(e.getMessage());
            }
            return;
        }
    }


    @Override
    protected long getLastModified(HttpServletRequest req) {
        return super.getLastModified(req);
    }

    @Override
    protected void doHead(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        super.doHead(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        super.doOptions(req, resp);
    }

    @Override
    protected void doTrace(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        super.doTrace(req, resp);
    }

    @Override
    public void destroy() {
        super.destroy();
    }

    @Override
    public ServletContext getServletContext() {
        return super.getServletContext();
    }

    @Override
    protected void service(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        super.service(req, resp);
    }

    @Override
    public void service(ServletRequest req, ServletResponse res) throws ServletException, IOException {
        super.service(req, res);
    }


    @Override
    public void sessionCreated(HttpSessionEvent se) {
        System.out.println("Session created : " + se.getSession());
    }

    @Override
    public void sessionDestroyed(HttpSessionEvent se) {
        System.out.println("Session destroy : " + se.getSession());
    }

}
