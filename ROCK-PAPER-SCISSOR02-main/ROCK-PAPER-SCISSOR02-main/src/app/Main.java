package app;

import javafx.application.Application;
import javafx.fxml.FXMLLoader;
import javafx.scene.Scene;
import javafx.stage.Stage;

import java.net.URL;

public class Main extends Application {
    @Override
    public void start(Stage stage) throws Exception {
        // Load FXML using resource path
        URL fxmlLocation = getClass().getResource("rps2.fxml");
        if (fxmlLocation == null) {
            throw new RuntimeException("FXML file not found!");
        }

        FXMLLoader loader = new FXMLLoader(fxmlLocation);
        Scene scene = new Scene(loader.load());

        // Load CSS from resources
        URL cssLocation = getClass().getResource("styles.css");
        if (cssLocation != null) {
            scene.getStylesheets().add(cssLocation.toExternalForm());
        }

        stage.setTitle("Rock Paper Scissors - Pro Edition");
        stage.setScene(scene);
        stage.show();
    }

    public static void main(String[] args) {
        launch();
    }
}
