
export class LocalStorage {
    constructor() {
        this.ob_user_name = "guest";
        this.ob_email = "";
        this.ob_hypergraph_name = "test";
        this.ob_hypergraph_file = "models/hypergraph.json";
    }

    read() {
        try {
            if (localStorage['ob_user_name'] !== undefined) {
                this.ob_user_name = JSON.parse(localStorage['ob_user_name'].toLowerCase());
                this.ob_email = JSON.parse(localStorage['ob_email'].toLowerCase());
                this.ob_hypergraph_name = JSON.parse(localStorage['ob_hypergraph_name']);
                this.ob_hypergraph_file = JSON.parse(localStorage['ob_hypergraph_file']);
            } else {
                localStorage.ob_user_name = JSON.stringify({ value: "guest" });
                localStorage.ob_email = JSON.stringify({ value: "" });
                localStorage.ob_hypergraph_name = JSON.stringify({ value: "test" });
                localStorage.ob_hypergraph_file = JSON.stringify({ value: "models/hypergraph.json" });
            }
        } catch (e) {
            // Handle exceptions here if needed
        }

        if (this.ob_user_name === "guest") {
            localStorage.ob_user_name = JSON.stringify({ value: "guest" });
            localStorage.ob_email = JSON.stringify({ value: "" });
            localStorage.ob_hypergraph_name = JSON.stringify({ value: "test" });
            localStorage.ob_hypergraph_file = JSON.stringify({ value: "models/hypergraph.json" });
        }
    }

    save(user_name, email, hypergraph_name) {
        if (user_name.replace(/ /g, "") !== "") {
            localStorage.ob_user_name= JSON.stringify({ value: user_name.toLowerCase() });
            localStorage.ob_email = JSON.stringify({ value: email.toLowerCase() });
            localStorage.ob_hypergraph_name = JSON.stringify({ value: hypergraph_name });
            localStorage.ob_hypergraph_file = JSON.stringify({ value: hypergraph_name });
        }
    }
}