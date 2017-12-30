//2017 Kurt Apple WTFPL
//github: kurt-apple

//WTFPL as in WTF are you doing, use the other source file.
//this is just here for historical reference.

package recursive_pf;

import java.util.Scanner;

public class Recursive_pf {

    public static void main(String[] args) {
        //old code, use the google script instead!!
        while(true) {
            System.out.print("Enter probability of win: ");
            Scanner s = new Scanner(System.in);
            double p = s.nextDouble();
            System.out.print("Okay, " + p + ". Enter risk reward ratio: ");
            double r = s.nextDouble();
            System.out.print("Okay, " + r + ". Enter trades to generate: ");
            int c = s.nextInt();
            System.out.print("Okay, " + c + ".\n");

            double last_x = 1;
            int i = 1;
            int j = 1;
            int pwra = 1;
            double prev = 0;
            double tmp = 0;
            while(last_x < c && j < c) {
                tmp = calc_pf(p, r, i);
                if(tmp - prev < 0.01) break;
                if(tmp > last_x) {
                    System.out.println("* " + i + ": " + tmp);
                    last_x++;
                }
                else if(i%pwra == 0) {
                    System.out.println(i + ": " + tmp);
                    j++;
                    pwra *= 2;
                }
                prev = tmp;
                i++;
            }
        }
        
    }
    
    // depth = 0 (2 possibilities)
    // W|L
    //
    // depth = 1 (3 possibilities)
    //      W+W
    //      W+L
    //  L
    //
    // depth = 2 (4 possibilities)
    //          W+W+W
    //          W+W+L
    //      W+L
    //  L
    
    private static double calc_pf(double probability, double riskreward, int trades) {
        if(trades == 1) return probability*riskreward - (1-probability);
        double pf = Math.pow(probability, (double)trades) * (trades * riskreward);
        pf += calc_pf_tails(probability, riskreward, trades);
        return pf;
    }
    
    private static double calc_pf_tails(double probability, double riskreward, int trades) {
        if(trades == 1) return -1*(1-probability);
        double sub_prob = Math.pow(probability, (double)trades-1.0);
        double pf_tails = sub_prob*(riskreward*(trades-1)) - sub_prob*(1-probability);
        pf_tails += calc_pf_tails(probability, riskreward, trades-1);
        return pf_tails;
    }
}
