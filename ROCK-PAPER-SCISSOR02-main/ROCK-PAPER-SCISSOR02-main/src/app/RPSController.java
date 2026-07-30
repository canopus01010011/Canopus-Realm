package app;

import javafx.fxml.FXML;
import javafx.scene.control.Button;
import javafx.scene.control.Label;

import java.util.Random;

public class RPSController {
    @FXML
    private Button rockBtn, paperBtn, scissorsBtn;
    @FXML
    private Label resultLabel, playerScore, computerScore;

    private final String[] choices = { "Rock", "Paper", "Scissors" };
    private final Random random = new Random();
    private int playerPoints = 0;
    private int computerPoints = 0;

    @FXML
    private void handleChoice(javafx.event.ActionEvent event) {
        String playerChoice = ((Button) event.getSource()).getText().replaceAll("[^a-zA-Z]", ""); 
        String computerChoice = choices[random.nextInt(choices.length)];

        String winner;
        if (playerChoice.equals(computerChoice)) {
            winner = "😐 It's a Tie! Both chose " + playerChoice;
            resultLabel.setStyle("-fx-text-fill: #FFD700;"); 
        } else if ((playerChoice.equals("Rock") && computerChoice.equals("Scissors")) ||
                (playerChoice.equals("Paper") && computerChoice.equals("Rock")) ||
                (playerChoice.equals("Scissors") && computerChoice.equals("Paper"))) {
            winner = "✅ You Win! " + playerChoice + " beats " + computerChoice;
            playerPoints++;
            resultLabel.setStyle("-fx-text-fill: #00FF7F;");
        } else {
            winner = "❌ You Lose! " + computerChoice + " beats " + playerChoice;
            computerPoints++;
            resultLabel.setStyle("-fx-text-fill: #FF4500;"); 
        }

        resultLabel.setText(winner);
        playerScore.setText("Player: " + playerPoints);
        computerScore.setText("Computer: " + computerPoints);
    }

    @FXML
    private void resetGame() {
        playerPoints = 0;
        computerPoints = 0;
        playerScore.setText("Player: 0");
        computerScore.setText("Computer: 0");
        resultLabel.setText("Make your move!");
        resultLabel.setStyle("-fx-text-fill: #FFFFFF;");
    }
}

