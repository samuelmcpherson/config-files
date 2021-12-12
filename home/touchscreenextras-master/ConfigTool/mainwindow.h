/****************************************************************************
 **
 ** Copyright 2019 Piotr Grosiak     Kenlin.pl Polska
 **
 ** This file is part of TouchscreenExtras.
 **
 **  TouchscreenExtras is free software: you can redistribute it and/or modify
 **  it under the terms of the GNU General Public License as published by
 **  the Free Software Foundation, either version 3 of the License, or
 **  (at your option) any later version.
 **
 **  TouchscreenExtras is distributed in the hope that it will be useful,
 **  but WITHOUT ANY WARRANTY; without even the implied warranty of
 **  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 **  GNU General Public License for more details.
 **
 **  You should have received a copy of the GNU General Public License
 **  along with this program.  If not, see <http://www.gnu.org/licenses/>
 **
****************************************************************************/
#ifndef MAINWINDOW_H
#define MAINWINDOW_H

#include <QMainWindow>
#include <QAbstractButton>
#include <QProcess>

namespace Ui {
class MainWindow;
}

class MainWindow : public QMainWindow
{
    Q_OBJECT
private:
    QProcess *devTest = new QProcess;
    int maxX=0;
    int maxY=0;
    bool regMax = false;
public:
    explicit MainWindow(QWidget *parent = nullptr);
    ~MainWindow();

private slots:
    void on_SlideLeft_toggled(bool checked);

    void on_SlideRight_toggled(bool checked);

    void on_SlideTop_toggled(bool checked);

    void on_SlideBottom_toggled(bool checked);

    void on_SwipeLeft_toggled(bool checked);

    void on_SwipeRight_toggled(bool checked);

    void on_SwipeTop_toggled(bool checked);

    void on_SwipeBotton_toggled(bool checked);

    void on_EdgeSizeX_sliderMoved(int position);

    void on_EdgeSizeX_valueChanged(int value);

    void on_EdgeSizeY_sliderMoved(int position);

    void on_EdgeSizeY_valueChanged(int value);

    void on_pressTime_valueChanged(double arg1);

    void on_pressTolerance_valueChanged(int value);

    void on_SwipeLenX_valueChanged(int value);

    void on_SwipeLenY_valueChanged(int value);

    void on_SwipeTolX_valueChanged(int value);

    void on_SwipeTolY_valueChanged(int value);

    void on_SlideLenX_valueChanged(int value);

    void on_SlideLenY_valueChanged(int value);

    void on_SlideTolX_valueChanged(int value);

    void on_SlideTolY_valueChanged(int value);

    void on_scrollArea_valueChanged(int value);

    void on_slideTimeout_valueChanged(double arg1);

    void on_pushButton_clicked();

    void on_buttonApply_clicked();

    void on_pushButton_3_clicked();

    void on_restartSvr_clicked();

    void on_device_currentIndexChanged(int index);

    void on_AutoScreenSize_toggled(bool checked);

    void on_screenX_valueChanged(int arg1);

    void on_ScreenY_valueChanged(int arg1);

    void on_deviceOut_textChanged(const QString &arg1);

    void on_addBlacklist_clicked();

    void on_remBlacklist_clicked();

    void on_TapAndMoveTolerance_valueChanged(int value);

    void on_ScrollInterval_valueChanged(int value);

    void on_TapAndMoveTime_valueChanged(double arg1);

    void on_TapAndMoveToScroll_clicked(bool checked);

private:
    Ui::MainWindow *ui;
};

#endif // MAINWINDOW_H
